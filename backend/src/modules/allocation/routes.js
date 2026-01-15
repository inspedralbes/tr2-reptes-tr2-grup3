const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const {
  runAllocation,
  getDemandSummaryController,
  listAllocations,
  confirmAllocation,
  addStudentToAllocation,
  getAllocationById,
} = require('./controller');

const router = express.Router();

/**
 * GET /api/allocation/demand-summary
 * Mostrar demanda actual antes de ejecutar el algoritmo
 * Query: ?period_id=xxx
 * Solo acceso ADMIN
 */
router.get('/demand-summary', authenticate, getDemandSummaryController);

/**
 * POST /api/allocation/run
 * Ejecutar el algoritmo de asignación inteligente
 * Body: { period_id: UUID }
 * Respeta: disponibilidad de martes, máx 4 por centro, máx 16 totales, preferencias docentes
 * Solo acceso ADMIN
 */
router.post('/run', authenticate, runAllocation);

/**
 * GET /api/allocations
 * Listar todas las asignaciones
 * Query params: ?period_id=xxx&school_id=yyy&status=PROVISIONAL|PUBLISHED|ACCEPTED
 */
router.get('/', authenticate, listAllocations);

/**
 * PUT /api/allocations/:id/confirm
 * Centro confirma su asignación e ingresa nombres de alumnos
 * Body: { students: [ { name: "Juan", idalu: "123" }, ... ] }
 * Solo acceso CENTER_COORD
 */
router.put('/:id/confirm', authenticate, confirmAllocation);

/**
 * POST /api/allocations/:id/students
 * Vincular un alumno existente a una asignación
 * Body: { student_id: UUID }
 * Solo acceso CENTER_COORD
 */
router.post('/:id/students', authenticate, addStudentToAllocation);

/**
 * GET /api/allocations/:id
 * Detalles de una asignación
 */
router.get('/:id', authenticate, getAllocationById);

module.exports = router;
