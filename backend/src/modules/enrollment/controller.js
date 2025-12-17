const listEnrollmentPeriods = (req, res) => {
  res.json([
    { id: 'p-2024', name: 'Curso 2024-2025', status: 'open' },
    { id: 'p-2023', name: 'Curso 2023-2024', status: 'closed' },
  ]);
};

module.exports = {
  listEnrollmentPeriods,
};
