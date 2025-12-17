const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { listEnrollmentPeriods } = require('./controller');

const router = express.Router();

router.get('/periods', authenticate, listEnrollmentPeriods);

module.exports = router;
