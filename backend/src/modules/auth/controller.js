const authService = require('./service');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const { user, token } = authService.login({ email, password });
  res.json({ user, token });
};

const me = (req, res) => {
  res.json({ user: req.user || null });
};

module.exports = {
  login,
  me,
};
