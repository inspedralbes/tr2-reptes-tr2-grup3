const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const {
  listWorkshops,
  getWorkshop,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
} = require('./controller');

const router = express.Router();

/**
 * GET /api/catalog/workshops
 * List all workshops with optional filters
 * Query params: ?ambit=Tecnologic|Artístic|Sostenibilitat, ?is_new=true|false
 */
router.get('/workshops', authenticate, listWorkshops);

/**
 * GET /api/catalog/workshops/:id
 * Get a specific workshop with all its editions
 */
router.get('/workshops/:id', authenticate, getWorkshop);

/**
 * POST /api/catalog/workshops
 * Create a new workshop (ADMIN only)
 * Body: { title, ambit, is_new, description, provider_id }
 */
router.post('/workshops', authenticate, createWorkshop);

/**
 * PUT /api/catalog/workshops/:id
 * Update an existing workshop (ADMIN only)
 * Body: { title?, ambit?, is_new?, description?, provider_id? }
 */
router.put('/workshops/:id', authenticate, updateWorkshop);

/**
 * DELETE /api/catalog/workshops/:id
 * Delete a workshop (ADMIN only)
 */
router.delete('/workshops/:id', authenticate, deleteWorkshop);

module.exports = router;
