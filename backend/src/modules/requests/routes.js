const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { requireFields } = require('../../common/middleware/validation');
const { listRequests, createRequest, getRequestById, updateRequest, cancelRequest } = require('./controller');

const router = express.Router();

// GET - Listar solicitudes con filtros
router.get('/', authenticate, listRequests);

// GET - Obtener solicitud por ID
router.get('/:id', authenticate, getRequestById);

// POST - Crear nueva solicitud (CENTER_COORD)
router.post('/', authenticate, requireFields(['enrollment_period_id', 'school_id', 'items']), createRequest);

// PUT - Actualizar solicitud (CENTER_COORD)
router.put('/:id', authenticate, updateRequest);

// DELETE - Cancelar solicitud (CENTER_COORD)
router.delete('/:id', authenticate, cancelRequest);

module.exports = router;
