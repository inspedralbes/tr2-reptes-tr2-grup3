const listWorkshops = (req, res) => {
  res.json([
    { id: 'w-1', title: 'Robótica básica', provider: 'MakerLab', seats: 25 },
    { id: 'w-2', title: 'Impresión 3D', provider: 'FabSchool', seats: 20 },
  ]);
};

module.exports = {
  listWorkshops,
};
