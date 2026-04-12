import logger from '../lib/logger.js';
import { response } from '../lib/response.js';

/**
 * Middleware central de manejo de errores
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
    user: req.user?.id
  });

  // Manejo de errores específicos
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return response.error(res, 'Sesión expirada o no válida', 401);
  }

  if (err.name === 'ValidationError') {
    return response.error(res, err.message, 400);
  }

  // Error genérico
  return response.error(
    res, 
    'Ha ocurrido un error inesperado. Por favor intente de nuevo.', 
    err.status || 500,
    err
  );
};
