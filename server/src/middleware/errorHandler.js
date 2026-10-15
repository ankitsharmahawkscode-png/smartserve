const ApiError = require('../utils/ApiError');
const { nodeEnv } = require('../config/env');

exports.notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || [];
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON in request body'; errors = []; }
  if (err.type === 'entity.too.large') { status = 413; message = 'Request body is too large'; errors = []; }
  if (err.name === 'ZodError') {
    status = 400; message = 'Validation failed';
    errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  }
  if (err.name === 'ValidationError' && err.errors && !Array.isArray(err.errors)) {
    status = 400; message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }
  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; errors = []; }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message = field ? `A record with this ${field} already exists` : 'Duplicate value';
    errors = [];
  }
  if (status === 500 && nodeEnv === 'production') message = 'Internal server error';
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message, errors });
};