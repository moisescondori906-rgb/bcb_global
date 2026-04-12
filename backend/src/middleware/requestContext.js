import { findUserById } from '../lib/queries.js';

/**
 * Tras `authenticate`: carga el usuario una sola vez por petición HTTP.
 * Las rutas deben usar `req.requestUser` en lugar de volver a llamar a `findUserById`.
 */
export async function attachRequestUser(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    req.requestUser = await findUserById(req.user.id);
    next();
  } catch (e) {
    next(e);
  }
}
