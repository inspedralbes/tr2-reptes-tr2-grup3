const authService = require('./service');

/**
 * POST /api/auth/login
 * Autentica un usuario con email y contraseña
 * Devuelve: { user: {...}, token: "jwt..." }
 * Body: { email, password }
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validación de entrada
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required' 
    });
  }

  try {
    const { user, token } = await authService.login({ email, password });
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ 
      error: error.message || 'Authentication failed' 
    });
  }
};

/**
 * GET /api/auth/me
 * Devuelve el perfil del usuario autenticado (desde el token JWT)
 * Requiere: Authorization: Bearer <token>
 */
const me = async (req, res) => {
  try {
    // req.user viene del middleware authMiddleware
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const profile = await authService.getProfile(req.user.id);
    res.json({ user: profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login,
  me,
};
