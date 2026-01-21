const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { requireFields } = require('../../common/middleware/validation');
const { canCreateRequests } = require('../../common/middleware/phaseMiddleware');
const { listRequests, createRequest, getRequestById, updateRequest, cancelRequest } = require('./controller');

const router = express.Router();

// GET - Listar solicitudes con filtros (cualquier fase, para historial)
router.get('/', authenticate, listRequests);

// GET - Obtener solicitud por ID (cualquier fase, para historial)
router.get('/:id', authenticate, getRequestById);

// POST - Crear nueva solicitud (CENTER_COORD) - Solo en fase SOLICITUDES
router.post('/', authenticate, canCreateRequests, requireFields(['enrollment_period_id', 'school_id', 'items']), createRequest);

// PUT - Actualizar solicitud (CENTER_COORD) - Solo en fase SOLICITUDES
router.put('/:id', authenticate, canCreateRequests, updateRequest);

// DELETE - Cancelar solicitud (CENTER_COORD) - Solo en fase SOLICITUDES
router.delete('/:id', authenticate, canCreateRequests, cancelRequest);

module.exports = router;
