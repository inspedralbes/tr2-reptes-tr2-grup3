const { signToken } = require('../../common/jwtHelpers');

const login = ({ email }) => {
  const user = {
    id: 'demo-user',
    email,
    role: 'admin',
    name: 'Demo User',
  };

  const token = signToken(user);
  return { user, token };
};

module.exports = {
  login,
};
