const express = require('express');
const {
  listEnrollmentPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
  publishPeriod,
} = require('./controller');
const { authenticate } = require('../../common/middleware/authMiddleware');

const router = express.Router();

// CRUD Períodos de Matrícula
// GET - Listar todos los períodos
router.get('/periods', authenticate, listEnrollmentPeriods);

// GET - Obtener período específico por ID
router.get('/periods/:id', authenticate, getPeriodById);

// POST - Crear nuevo período (solo ADMIN)
router.post('/periods', authenticate, createPeriod);

// PUT - Actualizar período (solo ADMIN)
router.put('/periods/:id', authenticate, updatePeriod);

// DELETE - Eliminar período (solo ADMIN)
router.delete('/periods/:id', authenticate, deletePeriod);

// PUT - Publicar resultados de un período (solo ADMIN)
router.put('/periods/:id/publish', authenticate, publishPeriod);

module.exports = router;
