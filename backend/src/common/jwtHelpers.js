// NOTE: This is a lightweight placeholder implementation.
// Replace with a real JWT library (e.g., jsonwebtoken) when wiring auth.
const signToken = (payload) => {
  const encoded = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  return encoded;
};

const verifyToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

module.exports = {
  signToken,
  verifyToken,
};
