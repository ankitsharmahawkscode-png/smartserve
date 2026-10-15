// validate(schema) parses req.body and replaces it with the cleaned result.
// Unknown keys (e.g. a malicious "role") are stripped by zod.
module.exports = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    next(err);
  }
};