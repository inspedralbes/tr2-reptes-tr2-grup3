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
  next();
};

module.exports = {
  authenticate,
};
