import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`[Error] ${err.message}`, { path: req.path, method: req.method });

  const statusCode = err.statusCode || 500;
  
  // Respuestas estructuradas
  res.status(statusCode).json({
    ok: false,
    error: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
