const listUsers = (req, res) => {
  res.json([
    { id: 'u-1', name: 'Alice', role: 'admin', email: 'alice@example.com' },
    { id: 'u-2', name: 'Bob', role: 'teacher', email: 'bob@example.com' },
  ]);
};

module.exports = {
  listUsers,
};
