const runAllocation = (req, res) => {
  const summary = {
    allocations: 42,
    pendingRequests: 3,
    timestamp: new Date().toISOString(),
  };
  res.json(summary);
};

module.exports = {
  runAllocation,
};
