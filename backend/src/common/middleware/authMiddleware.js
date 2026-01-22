const { verifyToken } = require("../jwtHelpers");

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  // console.log('🔍 Auth Header:', header ? 'Present' : 'Missing');

  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = user;
  req.user = user;
  next();
};

const isAuthenticated = authenticate;

const isCenterCoord = (req, res, next) => {
  if (req.user && req.user.role === 'CENTER_COORD') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Requereix ser Coordinador de Centre' });
  }
};

/**
 * Middleware para verificar rol TEACHER (profesor referente del taller)
 */
const isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'TEACHER') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Requereix ser Professor Referent' });
  }
};

/**
 * Middleware para verificar que el usuario es TEACHER o ADMIN
 */
const isTeacherOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'TEACHER' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Requereix ser Professor Referent o Administrador' });
  }
};

module.exports = {
  authenticate,
  isAuthenticated,
  isCenterCoord,
  isTeacher,
  isTeacherOrAdmin,
};
