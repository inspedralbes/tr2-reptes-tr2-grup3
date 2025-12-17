const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { requireFields } = require('../../common/middleware/validation');
const { listRequests, createRequest } = require('./controller');

const router = express.Router();

router.get('/', authenticate, listRequests);
router.post('/', authenticate, requireFields(['center', 'items']), createRequest);

module.exports = router;
