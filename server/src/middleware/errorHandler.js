import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err, 'Unhandled Exception in API handler: ' + err.message);

  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  const response = {
    success: false,
    error: {
      code: errorCode,
      message:
        statusCode === 500 && process.env.NODE_ENV === 'production'
          ? 'An unexpected internal server error occurred.'
          : err.message,
    },
  };

  if (err.details) {
    response.error.details = err.details;
  }

  res.status(statusCode).json(response);
};
