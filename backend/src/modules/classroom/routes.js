const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { listSessions } = require('./controller');

const router = express.Router();

router.get('/sessions', authenticate, listSessions);

module.exports = router;
