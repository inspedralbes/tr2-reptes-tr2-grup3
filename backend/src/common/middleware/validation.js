const requireFields = (fields) => (req, res, next) => {
  const missing = fields.filter((field) => !req.body[field]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
  }
  next();
};

module.exports = {
  requireFields,
};
