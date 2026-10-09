const ApiError = require('../utils/ApiError');
const { nodeEnv } = require('../config/env');

exports.notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || [];
  if (err.name === 'ZodError') {
    status = 400; message = 'Validation failed';
    errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  }
  if (err.code === 11000) { status = 409; message = 'Duplicate value'; }
  if (status === 500 && nodeEnv === 'production') message = 'Internal server error';
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message, errors });
};
