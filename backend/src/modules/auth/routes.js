const express = require('express');
const { login, me } = require('./controller');
const { authenticate } = require('../../common/middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, me);

module.exports = router;
