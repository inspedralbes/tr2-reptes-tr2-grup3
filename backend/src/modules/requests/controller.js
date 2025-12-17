const listRequests = (req, res) => {
  res.json([
    { id: 'r-1', center: 'Center A', status: 'pending' },
    { id: 'r-2', center: 'Center B', status: 'approved' },
  ]);
};

const createRequest = (req, res) => {
  const payload = req.body;
  res.status(201).json({ id: 'r-new', ...payload, status: 'pending' });
};

module.exports = {
  listRequests,
  createRequest,
};
