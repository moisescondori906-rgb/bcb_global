/**
 * Utilidad para respuestas estandarizadas
 */
export const response = {
  success: (res, data = {}, message = 'Operación exitosa', status = 200) => {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  },

  error: (res, message = 'Error interno del servidor', status = 500, error = null) => {
    const responseBody = {
      success: false,
      message,
    };

    if (error && process.env.NODE_ENV === 'development') {
      responseBody.error = error.message || error;
      responseBody.stack = error.stack;
    }

    return res.status(status).json(responseBody);
  }
};
