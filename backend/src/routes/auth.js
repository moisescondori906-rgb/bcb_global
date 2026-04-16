import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { findUserByTelefono, createUser, getLevels, updateUser } from '../lib/queries.js';
import { queryOne } from '../config/db.js';
import { BillingService } from '../services/billingService.js';
import { DEMO_USER_ID, DEMO_USER_DATA } from '../middleware/requestContext.js';
import logger from '../lib/logger.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sav-demo-secret';

router.post('/register', async (req, res) => {
  try {
    const { telefono, nombre_usuario, password, codigo_invitacion, deviceId } = req.body;
    if (!telefono || !nombre_usuario || !password || !codigo_invitacion) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // 1. Validaciones en paralelo para reducir tiempo total
    const [exists, inviter, levels] = await Promise.all([
      findUserByTelefono(telefono),
      queryOne(`SELECT id FROM usuarios WHERE codigo_invitacion = ?`, [codigo_invitacion]),
      getLevels()
    ]);

    if (exists) return res.status(400).json({ error: 'Teléfono ya registrado' });
    if (!inviter) return res.status(400).json({ error: 'Código de invitación inválido' });

    // SaaS Check: Límite de usuarios por plan
    if (req.tenantId) {
      const canAddUser = await BillingService.checkLimits(req.tenantId, 'users_count');
      if (!canAddUser) return res.status(403).json({ error: 'Límite de usuarios alcanzado para su plan SaaS.' });
    }
    
    const internarLevel = levels.find(l => String(l.codigo).toLowerCase() === 'internar' || String(l.id) === 'l1');
    
    // REGLA ACTUALIZADA: Los usuarios AHORA pueden invitar, pero no recibirán comisiones (manejado en distributeInvestmentCommissions)
    const codigo = Math.random().toString(36).slice(2, 10).toUpperCase();
    const user = {
      id: uuidv4(),
      telefono,
      nombre_usuario,
      nombre_real: nombre_usuario,
      password_hash: await bcrypt.hash(password, 10),
      codigo_invitacion: codigo,
      invitado_por: inviter.id,
      nivel_id: internarLevel ? internarLevel.id : levels[0].id,
      saldo_principal: 0,
      saldo_comisiones: 0,
      rol: 'usuario',
      bloqueado: false,
      tickets_ruleta: 0,
      primer_ascenso_completado: false,
      last_device_id: deviceId || null
    };
    
    await createUser(user); 
    
    // SaaS Usage: Incrementar contador de usuarios
    if (req.tenantId) {
      await BillingService.trackUsage(req.tenantId, 'users_count');
    }

    const token = jwt.sign({ 
       id: user.id, 
       rol: user.rol, 
       tenantId: user.tenant_id,
       region: req.tenant?.region || 'global'
     }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: sanitizeUser(user, levels), token });
  } catch (e) {
    logger.error('[Auth] Error en register:', e);
    res.status(500).json({ error: e.message || 'Error interno en el servidor' });
  }
});

router.post('/login', async (req, res) => {
  const startTime = Date.now();
  const { telefono, password, deviceId } = req.body;
  
  try {
    // 1. MODO DEMO: Bypass para el usuario de prueba y administrador
    if (telefono === '+59174344916' && password === '123456') {
      const levels = await getLevels().catch(() => [
        { id: 'l1', codigo: 'pasante', nombre: 'Pasante' },
        { id: 'l2', codigo: 'Global 1', nombre: 'Global 1' }
      ]);
      const token = jwt.sign({ id: DEMO_USER_ID, rol: 'usuario' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: sanitizeUser(DEMO_USER_DATA, levels), token });
    }

    if (telefono === '+59170000000' && password === 'admin123') {
      const levels = await getLevels().catch(() => [
        { id: 'l1', codigo: 'pasante', nombre: 'Pasante' },
        { id: 'l2', codigo: 'l2', nombre: 'Global 1' }
      ]);
      const adminData = {
        id: 'ADMIN-DEMO-ID',
        telefono: '+59170000000',
        nombre_usuario: 'admin_demo',
        nombre_real: 'Admin Demostración',
        codigo_invitacion: 'ADMIN-001',
        nivel_id: 'l2',
        rol: 'admin',
        saldo_principal: 999999,
        saldo_comisiones: 999999,
        bloqueado: false
      };
      const token = jwt.sign({ id: 'ADMIN-DEMO-ID', rol: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: sanitizeUser(adminData, levels), token });
    }

    // 2. findUserByTelefono ya tiene deduplicación y timeout rápido en queries.js
    const user = await findUserByTelefono(telefono, req.tenantId);
    
    if (!user) {
      logger.warn(`[Auth] Intento de login fallido para ${telefono} en tenant ${req.tenantId}: No existe`);
      return res.status(401).json({ error: 'Credenciales incorrectas o el usuario no pertenece a esta empresa' });
    }
    
    if (user.bloqueado) {
      logger.warn(`[Auth] Usuario bloqueado intentó entrar: ${telefono}`);
      return res.status(403).json({ 
        error: 'Tu cuenta ha sido bloqueada. Contacta a administración.' 
      });
    }
    
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      logger.warn(`[Auth] Intento de login fallido para ${telefono}: Password incorrecto`);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // JWT con Contexto SaaS (Tenant + Rol)
    const token = jwt.sign({ 
      id: user.id, 
      rol: user.rol, 
      tenantId: user.tenant_id,
      region: req.tenant?.region || 'global'
    }, JWT_SECRET, { expiresIn: '7d' });

    // Actualizar deviceId si es necesario
    if (deviceId && user.last_device_id !== deviceId) {
      updateUser(user.id, { last_device_id: deviceId }).catch(() => {});
    }

    const levels = await getLevels();
    res.json({ user: sanitizeUser(user, levels), token });
  } catch (e) {
    logger.error(`[Auth] Error crítico en login [${Date.now() - startTime}ms]:`, e.message || e);
    res.status(500).json({ error: 'Error interno en el servidor. Intente de nuevo.' });
  }
});

function sanitizeUser(u, levels) {
  const level = levels.find(l => String(l.id) === String(u.nivel_id));
  return {
    id: u.id,
    telefono: u.telefono,
    nombre_usuario: u.nombre_usuario,
    nombre_real: u.nombre_real,
    codigo_invitacion: u.codigo_invitacion,
    nivel: level?.nombre || 'Internar',
    nivel_id: u.nivel_id,
    nivel_codigo: level?.codigo || 'internar',
    saldo_principal: u.saldo_principal || 0,
    saldo_comisiones: u.saldo_comisiones || 0,
    rol: u.rol,
    avatar_url: u.avatar_url,
    tickets_ruleta: Number(u.tickets_ruleta) || 0,
    tiene_password_fondo: !!u.password_fondo_hash,
    last_device_id: u.last_device_id,
  };
}

export default router;
