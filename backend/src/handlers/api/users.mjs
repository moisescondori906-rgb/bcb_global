import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { 
  getLevels, updateUser, findUserWithAuthSecrets,
  getMensajesGlobales, peruTime, getUserTeamReport
} from '../../services/dbService.mjs';
import { authenticate } from '../../utils/middleware/auth.mjs';
import { attachRequestUser, DEMO_USER_ID } from '../../utils/middleware/requestContext.mjs';
import { query, queryOne } from '../../config/db.mjs';
import logger from '../../utils/logger.mjs';
import { asyncHandler } from '../../utils/asyncHandler.mjs';

const router = Router();

router.use(authenticate);
router.use(attachRequestUser);

function sanitizeUser(u, levels) {
  const safeLevels = Array.isArray(levels) ? levels : [];
  const level = safeLevels.find(l => String(l.id) === String(u.nivel_id));
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
    security_alert: u.security_alert,
    grado_colaborador: u.grado_colaborador || 'ninguno',
    salario_colaborador: Number(u.salario_colaborador || 0),
  };
}

router.get('/me', asyncHandler(async (req, res) => {
  try {
    const user = req.requestUser;
    if (!user) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const levels = await getLevels().catch(() => [
      { id: 'l1', codigo: 'internar', nombre: 'Internar' },
      { id: 'l2', codigo: 'global1', nombre: 'GLOBAL 1' }
    ]);
    
    res.json(sanitizeUser(user, levels));
  } catch (err) {
    logger.error('[USERS-ME-ERROR]', err.message);
    res.status(500).json({ error: 'Error interno al cargar perfil' });
  }
}));

router.post('/clear-security-alert', asyncHandler(async (req, res) => {
  await updateUser(req.user.id, { security_alert: null });
  res.json({ ok: true });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = req.requestUser;

  // 1. Ingresos Hoy (v13.1.2) - Sumamos ambos saldos si es necesario para el total acumulado
  const statsHoy = await queryOne(`
    SELECT 
      COALESCE(SUM(monto), 0) as total 
    FROM movimientos_saldo 
    WHERE usuario_id = ? AND DATE(fecha) = CURDATE() AND monto > 0
  `, [userId]);

  // 2. Ingresos Ayer
  const statsAyer = await queryOne(`
    SELECT 
      COALESCE(SUM(monto), 0) as total 
    FROM movimientos_saldo 
    WHERE usuario_id = ? AND DATE(fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND monto > 0
  `, [userId]);

  // 3. Ingresos Semana
  const statsSemana = await queryOne(`
    SELECT 
      COALESCE(SUM(monto), 0) as total 
    FROM movimientos_saldo 
    WHERE usuario_id = ? AND YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1) AND monto > 0
  `, [userId]);

  // 4. Ingresos Mes
  const statsMes = await queryOne(`
    SELECT 
      COALESCE(SUM(monto), 0) as total 
    FROM movimientos_saldo 
    WHERE usuario_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE()) AND monto > 0
  `, [userId]);

  // 5. Total Acumulado (Todas las ganancias históricas)
  const statsTotal = await queryOne(`
    SELECT 
      COALESCE(SUM(monto), 0) as total,
      COUNT(CASE WHEN tipo_movimiento IN ('tarea_completada', 'ganancia_tarea') THEN 1 END) as completadas
    FROM movimientos_saldo 
    WHERE usuario_id = ? AND monto > 0
  `, [userId]);

  res.json({
    ingresos_hoy: Number(statsHoy.total),
    ingresos_ayer: Number(statsAyer.total),
    ingresos_semana: Number(statsSemana.total),
    ingresos_mes: Number(statsMes.total),
    total_acumulado: Number(statsTotal.total),
    total_completadas: statsTotal.completadas,
    saldo_total_actual: Number(user.saldo_principal) + Number(user.saldo_comisiones)
  });
}));

router.get('/earnings', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = req.requestUser;

  // MODO DEMO
  if (userId === DEMO_USER_ID) {
    return res.json({
      summary: { total: user.saldo_principal + user.saldo_comisiones, hoy: 50.40, tareas: 30, comisiones: 20.40 },
      history: [
        { id: '1', tipo_movimiento: 'tarea', monto: 1.80, created_at: peruTime.getISOString(), descripcion: 'Tarea completada demo' },
        { id: '2', tipo_movimiento: 'tarea_red', monto: 0.50, created_at: peruTime.getISOString(), descripcion: 'Comisión red demo' }
      ]
    });
  }

  // 1. Obtener historial
  const movimientos = await query(`
    SELECT * FROM movimientos_saldo 
    WHERE usuario_id = ? 
    ORDER BY fecha DESC 
    LIMIT 50
  `, [userId]);

  // 2. Obtener resumen de HOY (v13.1.0)
  // Sumamos tareas + comisiones del día actual
  const statsHoy = await queryOne(`
    SELECT 
      COALESCE(SUM(CASE WHEN tipo_movimiento IN ('tarea_completada', 'ganancia_tarea') THEN monto ELSE 0 END), 0) as tareas_hoy,
      COALESCE(SUM(CASE WHEN tipo_movimiento IN ('comision_subordinado', 'comision_red', 'comision_inversion', 'comision_tarea') THEN monto ELSE 0 END), 0) as comisiones_hoy
    FROM movimientos_saldo 
    WHERE usuario_id = ? AND DATE(fecha) = CURDATE() AND monto > 0
  `, [userId]);

  // 3. Obtener resumen TOTAL (v13.1.0)
  const statsTotal = await queryOne(`
    SELECT 
      COALESCE(SUM(CASE WHEN tipo_movimiento IN ('tarea_completada', 'ganancia_tarea') THEN monto ELSE 0 END), 0) as tareas_total,
      COALESCE(SUM(CASE WHEN tipo_movimiento IN ('comision_subordinado', 'comision_red', 'comision_inversion', 'comision_tarea') THEN monto ELSE 0 END), 0) as comisiones_total
    FROM movimientos_saldo 
    WHERE usuario_id = ? AND monto > 0
  `, [userId]);
  
  res.json({
    summary: {
      total: Number(user.saldo_principal) + Number(user.saldo_comisiones),
      hoy: Number(statsHoy.tareas_hoy) + Number(statsHoy.comisiones_hoy),
      tareas_hoy: Number(statsHoy.tareas_hoy),
      comisiones_hoy: Number(statsHoy.comisiones_hoy),
      tareas_total: Number(statsTotal.tareas_total),
      comisiones_total: Number(statsTotal.comisiones_total)
    },
    history: movimientos
  });
}));

router.get('/team', asyncHandler(async (req, res) => {
  const report = await getUserTeamReport(req.user.id);
  res.json(report);
}));

router.get('/team-report', asyncHandler(async (req, res) => {
  const report = await getUserTeamReport(req.user.id);
  res.json(report);
}));

router.get('/tarjetas', asyncHandler(async (req, res) => {
  if (req.user.id === DEMO_USER_ID) return res.json([{ id: 'demo-card', nombre_banco: 'Banco Demo', numero_cuenta: '12345678', nombre_titular: 'Socio Demo' }]);
  const tarjetas = await query(`SELECT * FROM tarjetas_bancarias WHERE usuario_id = ? AND activa = 1`, [req.user.id]);
  res.json(tarjetas);
}));

router.get('/bank-accounts', asyncHandler(async (req, res) => {
  if (req.user.id === DEMO_USER_ID) return res.json([{ id: 'demo-card', banco: 'Banco Demo', numero_cuenta: '12345678', titular: 'Socio Demo' }]);
  const tarjetas = await query(`SELECT id, nombre_banco as banco, nombre_titular as titular, numero_cuenta, tipo_cuenta, ci_nit, principal FROM tarjetas_bancarias WHERE usuario_id = ? AND activa = 1`, [req.user.id]);
  res.json(tarjetas);
}));

router.post('/tarjetas', asyncHandler(async (req, res) => {
  if (req.user.id === DEMO_USER_ID) return res.json({ id: 'demo-card', ok: true });
  const { nombre_banco, numero_cuenta, nombre_titular } = req.body;
  const id = uuidv4();
  await query(`INSERT INTO tarjetas_bancarias (id, usuario_id, nombre_banco, numero_cuenta, nombre_titular) VALUES (?, ?, ?, ?, ?)`,
    [id, req.user.id, nombre_banco, numero_cuenta, nombre_titular]);
  res.json({ id, ok: true });
}));

router.post('/bank-account', asyncHandler(async (req, res) => {
  if (req.user.id === DEMO_USER_ID) return res.json({ id: 'demo-card', success: true });
  const { banco, titular, numero_cuenta, tipo_cuenta, ci_nit } = req.body;
  
  if (!banco || !titular || !numero_cuenta) {
    return res.status(400).json({ error: 'Banco, titular y número de cuenta son obligatorios.' });
  }

  const id = uuidv4();
  
  // Verificar si es la primera cuenta para marcarla como principal
  const existingCount = await queryOne(`SELECT COUNT(*) as total FROM tarjetas_bancarias WHERE usuario_id = ?`, [req.user.id]);
  const isPrincipal = existingCount.total === 0 ? 1 : 0;

  await query(`
    INSERT INTO tarjetas_bancarias (id, usuario_id, nombre_banco, nombre_titular, numero_cuenta, tipo_cuenta, ci_nit, principal) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, banco, titular, numero_cuenta, tipo_cuenta, ci_nit, isPrincipal]
  );

  res.json({ success: true, id, message: 'Cuenta bancaria registrada correctamente.' });
}));

router.post('/fund-password', asyncHandler(async (req, res) => {
  const { password_fondo, confirm_password_fondo } = req.body;

  if (!password_fondo || password_fondo.length < 6) {
    return res.status(400).json({ error: 'La contraseña de fondos debe tener al menos 6 caracteres.' });
  }
  if (password_fondo !== confirm_password_fondo) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password_fondo, salt);

  await query(`UPDATE usuarios SET password_fondo_hash = ? WHERE id = ?`, [hash, req.user.id]);

  res.json({ success: true, message: 'Contraseña de fondos configurada correctamente.' });
}));

router.get('/security-status', asyncHandler(async (req, res) => {
  const user = await queryOne(`SELECT password_fondo_hash FROM usuarios WHERE id = ?`, [req.user.id]);
  const bankAccount = await queryOne(`SELECT id FROM tarjetas_bancarias WHERE usuario_id = ? AND activa = 1 LIMIT 1`, [req.user.id]);

  res.json({
    tiene_password_fondo: !!user?.password_fondo_hash,
    tiene_cuenta_bancaria: !!bankAccount
  });
}));

router.get('/mensajes', asyncHandler(async (req, res) => {
  const mensajes = await getMensajesGlobales().catch(() => [
    { id: 'm1', titulo: 'Bienvenido Socio Demo', contenido: 'Este es un mensaje de prueba para visualización.', fecha: peruTime.getISOString() }
  ]);
  res.json(mensajes);
}));

// ========================
// CUESTIONARIO (PASIVO)
// ========================

router.get('/cuestionario', asyncHandler(async (req, res) => {
  const config = await queryOne(`SELECT valor FROM configuraciones WHERE clave = 'cuestionario'`);
  if (!config) return res.json({ activo: false });
  
  const datos = JSON.parse(config.valor);
  if (!datos.activo) return res.json({ activo: false });

  // Verificar si el usuario ya respondió hoy
  const today = peruTime.todayStr();
  const yaRespondio = await queryOne(`SELECT id FROM respuestas_cuestionario WHERE usuario_id = ? AND fecha_dia = ?`, [req.user.id, today]);

  res.json({
    activo: true,
    ya_respondio: !!yaRespondio,
    datos: {
      id: datos.id,
      titulo: datos.titulo,
      preguntas: datos.preguntas
    }
  });
}));

router.post('/cuestionario/responder', asyncHandler(async (req, res) => {
  const { respuestas } = req.body;
  const today = peruTime.todayStr();
  
  // Guardar respuestas de forma pasiva
  await query(`INSERT INTO respuestas_cuestionario (id, usuario_id, fecha_dia, respuestas) VALUES (?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE respuestas = VALUES(respuestas)`, 
    [uuidv4(), req.user.id, today, JSON.stringify(respuestas)]);

  res.json({ ok: true, message: 'Gracias por participar en nuestra encuesta diaria.' });
}));

router.get('/my-referrals', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { nivel = 'A' } = req.query;

  let querySql = '';
  let params = [];

  if (nivel === 'A') {
    // Nivel A: Directos
    querySql = `
      SELECT u.id, u.telefono, u.nombre_usuario, u.created_at, n.nombre AS nivel, n.codigo AS nivel_codigo 
      FROM usuarios u 
      LEFT JOIN niveles n ON n.id = u.nivel_id 
      WHERE u.invitado_por = ? 
      ORDER BY u.created_at DESC
    `;
    params = [userId];
  } else if (nivel === 'B') {
    // Nivel B: Invitados por mis directos
    querySql = `
      SELECT u.id, u.telefono, u.nombre_usuario, u.created_at, n.nombre AS nivel, n.codigo AS nivel_codigo 
      FROM usuarios u 
      LEFT JOIN niveles n ON n.id = u.nivel_id 
      WHERE u.invitado_por IN (SELECT id FROM usuarios WHERE invitado_por = ?) 
      ORDER BY u.created_at DESC
    `;
    params = [userId];
  } else if (nivel === 'C') {
    // Nivel C: Invitados por el Nivel B
    querySql = `
      SELECT u.id, u.telefono, u.nombre_usuario, u.created_at, n.nombre AS nivel, n.codigo AS nivel_codigo 
      FROM usuarios u 
      LEFT JOIN niveles n ON n.id = u.nivel_id 
      WHERE u.invitado_por IN (
        SELECT id FROM usuarios WHERE invitado_por IN (
          SELECT id FROM usuarios WHERE invitado_por = ?
        )
      ) 
      ORDER BY u.created_at DESC
    `;
    params = [userId];
  }

  const referrals = await query(querySql, params);

  const maskPhoneLast5 = (phone) => {
    const raw = String(phone || '');
    const digits = raw.replace(/\D/g, '');
    const last5 = digits.slice(-5);
    if (!last5) return 'Sin número';
    return `******${last5}`;
  };

  const maskedReferrals = referrals.map(ref => ({
    id: ref.id,
    nombre_usuario: ref.nombre_usuario,
    telefono_masked: maskPhoneLast5(ref.telefono),
    nivel: ref.nivel,
    nivel_codigo: ref.nivel_codigo,
    created_at: ref.created_at
  }));

  res.json({
    items: maskedReferrals,
    total: maskedReferrals.length
  });
}));

router.delete('/my-referrals/:referralId', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { referralId } = req.params;

  // 1. Verificar que el referido pertenece al usuario y es "Internar"
  const referral = await queryOne(`
    SELECT u.*, n.codigo as nivel_codigo 
    FROM usuarios u 
    LEFT JOIN niveles n ON n.id = u.nivel_id 
    WHERE u.id = ? AND u.invitado_por = ?
  `, [referralId, userId]);

  if (!referral) {
    return res.status(404).json({ error: 'Referido no encontrado o no pertenece a tu equipo.' });
  }

  if (referral.nivel_codigo !== 'internar') {
    return res.status(400).json({ error: 'Solo puedes eliminar usuarios de nivel Pasante.' });
  }

  // 2. Eliminar usuario y su actividad (v12.2.0)
  await transaction(async (conn) => {
    await conn.query('DELETE FROM actividad_tareas WHERE usuario_id = ?', [referralId]);
    await conn.query('DELETE FROM movimientos_saldo WHERE usuario_id = ?', [referralId]);
    await conn.query('DELETE FROM retiros WHERE usuario_id = ?', [referralId]);
    await conn.query('DELETE FROM compras_nivel WHERE usuario_id = ?', [referralId]);
    await conn.query('DELETE FROM usuarios WHERE id = ?', [referralId]);
  });

  logger.info(`[USERS] Usuario ${userId} eliminó a su referido Pasante ${referralId}`);
  res.json({ success: true, message: 'Usuario Pasante eliminado correctamente.' });
}));

export default router;
