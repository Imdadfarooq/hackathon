const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Collects express-validator results and throws a 400 with field details
 * when any validation rule failed. Place after a rule array in a route.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const details = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return next(ApiError.badRequest('Validation failed', details));
}

module.exports = { validate };
