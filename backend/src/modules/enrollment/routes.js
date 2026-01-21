const express = require('express');
const {
  listEnrollmentPeriods,
  getPeriodById,
  getCurrentPhase,
  createPeriod,
  updatePeriod,
  activatePeriod,
  advancePhase,
  deletePeriod,
  publishPeriod,
} = require('./controller');
const { authenticate } = require('../../common/middleware/authMiddleware');

const router = express.Router();

// CRUD Períodos de Matrícula

// GET - Obtener fase actual del período activo (IMPORTANTE: debe ir antes de :id)
router.get('/periods/active/current-phase', authenticate, getCurrentPhase);

// GET - Listar todos los períodos
router.get('/periods', authenticate, listEnrollmentPeriods);

// GET - Obtener período específico por ID
router.get('/periods/:id', authenticate, getPeriodById);

// POST - Crear nuevo período (solo ADMIN)
router.post('/periods', authenticate, createPeriod);

// PUT - Actualizar período (solo ADMIN)
router.put('/periods/:id', authenticate, updatePeriod);

// PUT - Activar período (solo ADMIN) - Solo uno activo a la vez
router.put('/periods/:id/activate', authenticate, activatePeriod);

// PUT - Avanzar fase del período (solo ADMIN)
router.put('/periods/:id/advance-phase', authenticate, advancePhase);

// PUT - Publicar resultados de un período (DEPRECATED - usar advance-phase)
router.put('/periods/:id/publish', authenticate, publishPeriod);

// DELETE - Eliminar período (solo ADMIN)
router.delete('/periods/:id', authenticate, deletePeriod);

module.exports = router;
