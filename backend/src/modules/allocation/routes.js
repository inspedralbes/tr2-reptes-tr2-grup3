const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { runAllocation } = require('./controller');

const router = express.Router();

router.post('/run', authenticate, runAllocation);

module.exports = router;
