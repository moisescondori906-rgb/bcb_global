import { Router } from 'express';
import { sendToAdmin, sendToRetiros, sendToSecretaria } from '../services/telegramBot.js';

const router = Router();

/**
 * Endpoint de prueba para Telegram Multi-Bot
 * GET /api/telegram/test
 */
router.get('/test', async (req, res) => {
  try {
    console.log("Iniciando test Multi-Bot...");

    // Enviar mensajes usando los 3 bots diferentes
    const results = await Promise.allSettled([
      sendToRetiros("🚀 TEST BOT RETIROS OK"),
      sendToAdmin("🚀 TEST BOT ADMIN OK"),
      sendToSecretaria("🚀 TEST BOT SECRETARIA OK")
    ]);

    const status = {
      retiros: results[0].status === 'fulfilled' && results[0].value,
      admin: results[1].status === 'fulfilled' && results[1].value,
      secretaria: results[2].status === 'fulfilled' && results[2].value
    };

    res.json({ ok: true, status });
  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
