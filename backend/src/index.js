import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './lib/logger.js';
import { setupWebhooks } from './services/telegramBot.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import levelRoutes from './routes/levels.js';
import rechargeRoutes from './routes/recharges.js';
import withdrawalRoutes from './routes/withdrawals.js';
import telegramRoutes from './routes/telegram.js';
import adminRoutes from './routes/admin.js';
import telegramAdminRoutes from './routes/telegram_admin.js';
import sorteoRoutes from './routes/sorteo.js';
import saasRoutes from './routes/saas.js';
import telegramWebhookRoutes from './routes/telegram_webhook.js';
import { preloadConfig, preloadLevels } from './lib/queries.js';
import { query } from './config/db.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { tenantContext } from './middleware/tenantMiddleware.js';
import { slaMiddleware } from './middleware/slaMiddleware.js';

// Forzar Zona Horaria de Bolivia
process.env.TZ = 'America/La_Paz';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// 1. Seguridad & Middleware de Producción
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configuración de CORS estricta
const whitelist = [
  'https://sav-lat.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
};
app.use(cors(corsOptions));

// 2. Webhooks de Telegram (Endpoint dedicado antes de las rutas generales)
setupWebhooks(app).then(() => {
  logger.info('[SERVER] Webhooks de Telegram configurados.');
});

// 3. Health Check Avanzado (Métricas de Resiliencia)
app.get('/api/health', async (req, res) => {
  const start = Date.now();
  try {
    const { query } = await import('./config/db.js');
    const { default: redis } = await import('./services/redisService.js');
    const { default: telegramQueue } = await import('./services/BullMQService.js');
    
    // Medir latencia DB
    const dbStart = Date.now();
    await query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    // Medir latencia Redis
    const redisStart = Date.now();
    const redisStatus = await redis.ping();
    const redisLatency = Date.now() - redisStart;

    // Salud de la Cola
    const queueJobCounts = await telegramQueue.getJobCounts('waiting', 'active', 'failed', 'completed');
    
    // Métricas de SLA (Simulado para Health Check)
    const availability = (100 - (queueJobCounts.failed / (queueJobCounts.completed + queueJobCounts.failed || 1)) * 100).toFixed(2);
    
    res.json({ 
      status: 'ok', 
      uptime: process.uptime(),
      region: process.env.REGION || 'LATAM-BO-1',
      latencies: {
        database: `${dbLatency}ms`,
        redis: `${redisLatency}ms`,
        total_response: `${Date.now() - start}ms`
      },
      sla: {
        availability: `${availability}%`,
        target: '99.9%'
      },
      services: {
        database: 'connected',
        redis: redisStatus === 'PONG' ? 'connected' : 'error',
        queue: queueJobCounts
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('[HEALTH-CHECK] Fallo:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. Rutas de API
const apiV1 = express.Router();

// Inyectar contexto de Tenant y métricas de SLA
apiV1.use(tenantContext);
apiV1.use(slaMiddleware);

apiV1.use('/auth', rateLimiter(60000, 15), authRoutes);
apiV1.use('/users', userRoutes);
apiV1.use('/tasks', rateLimiter(60000, 40), taskRoutes);
apiV1.use('/levels', levelRoutes);
apiV1.use('/recharges', rechargeRoutes);
apiV1.use('/withdrawals', withdrawalRoutes);
apiV1.use('/telegram', telegramRoutes);
apiV1.use('/admin/telegram', telegramAdminRoutes);
apiV1.use('/admin', adminRoutes);
apiV1.use('/sorteo', sorteoRoutes);
apiV1.use('/saas', saasRoutes);

// Registrar Versiones de API
app.use('/api/v1', apiV1);
app.use('/api', apiV1); // Retrocompatibilidad para clientes antiguos

// Rutas de V2 (Sistema Autónomo Inteligente)
const apiV2 = express.Router();
apiV2.use(tenantContext);
// apiV2.use('/fraud', fraudV2Routes); // A implementar
app.use('/api/v2', apiV2);

// Servir archivos estáticos
const publicPath = path.join(__dirname, '../../frontend/public');
app.use('/imag', express.static(path.join(publicPath, 'imag')));
app.use('/video', express.static(path.join(publicPath, 'video')));
app.use('/', express.static(publicPath));

const startServer = async () => {
  try {
    await query('SELECT 1');
    logger.info('[DATABASE] MySQL conectado.');

    await preloadConfig().catch(() => {});
    await preloadLevels().catch(() => {});
    
    const server = app.listen(PORT, () => {
      logger.info(`[SUCCESS] Servidor Enterprise en puerto ${PORT}`);
    });

    // 5. Graceful Shutdown (Nivel Enterprise)
    const shutdown = async (signal) => {
      logger.info(`[SHUTDOWN] Recibida señal ${signal}. Cerrando sistema de forma segura...`);
      
      // Detener recepción de nuevas peticiones
      server.close(() => logger.info('[HTTP] Servidor detenido.'));

      try {
        const { closeBullMQ } = await import('./services/BullMQService.js');
        const { closeRedis } = await import('./services/redisService.js');
        const { pool } = await import('./config/db.js');

        await closeBullMQ();
        await closeRedis();
        if (pool) await pool.end();
        
        logger.info('[SUCCESS] Sistema cerrado correctamente.');
        process.exit(0);
      } catch (err) {
        logger.error('[ERROR] Durante shutdown:', err.message);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('[SERVER] Fallo al iniciar:', err);
  }
};

app.use(errorHandler);
startServer();
