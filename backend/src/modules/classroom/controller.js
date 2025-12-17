const listSessions = (req, res) => {
  res.json([
    { id: 's-1', workshopId: 'w-1', date: '2024-09-01', status: 'scheduled' },
    { id: 's-2', workshopId: 'w-2', date: '2024-09-08', status: 'scheduled' },
  ]);
};

module.exports = {
  listSessions,
};
