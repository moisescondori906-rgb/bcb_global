import { findUserById } from '../lib/queries.js';

export const DEMO_USER_ID = 'DEMO-USER-ID';
export const DEMO_USER_DATA = {
  id: DEMO_USER_ID,
  telefono: '+59174344916',
  nombre_usuario: 'demo_user',
  nombre_real: 'Usuario de Demostración',
  codigo_invitacion: 'DEMO-ABC',
  invitado_por: null,
  nivel_id: 'l2', // Global 1
  saldo_principal: 1500.00,
  saldo_comisiones: 250.50,
  rol: 'usuario',
  bloqueado: 0,
  tickets_ruleta: 5,
  created_at: new Date().toISOString()
};

/**
 * Tras `authenticate`: carga el usuario una sola vez por petición HTTP.
 * Las rutas deben usar `req.requestUser` en lugar de volver a llamar a `findUserById`.
 */
export async function attachRequestUser(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // MODO DEMO: Bypass si el ID es el de demo
  if (req.user.id === DEMO_USER_ID) {
    req.requestUser = DEMO_USER_DATA;
    return next();
  }

  try {
    req.requestUser = await findUserById(req.user.id);
    next();
  } catch (e) {
    next(e);
  }
}
