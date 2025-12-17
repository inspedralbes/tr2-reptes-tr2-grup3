const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { listWorkshops } = require('./controller');

const router = express.Router();

router.get('/workshops', authenticate, listWorkshops);

module.exports = router;
