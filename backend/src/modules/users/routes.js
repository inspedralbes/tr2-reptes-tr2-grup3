const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { listUsers } = require('./controller');

const router = express.Router();

router.get('/', authenticate, listUsers);

module.exports = router;
