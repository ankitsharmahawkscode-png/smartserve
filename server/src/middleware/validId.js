const ApiError = require('../utils/ApiError');

// Use with router.param('id', validId) so malformed ids return 404 instead of a 500.
module.exports = (req, res, next, id) =>
  /^[0-9a-fA-F]{24}$/.test(id) ? next() : next(new ApiError(404, 'Not found'));