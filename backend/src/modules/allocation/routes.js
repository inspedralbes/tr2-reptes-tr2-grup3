const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { 
  canRunAllocation, 
  canViewAllocations, 
  canViewDemand 
} = require('../../common/middleware/phaseMiddleware');
const {
  runAllocation,
  getDemandSummaryController,
  listAllocations,
  confirmAllocation,
  addStudentToAllocation,
  getAllocationById,
  updateAllocation,
  publishAllAllocations,
} = require('./controller');

const router = express.Router();

/**
 * GET /api/allocation/demand-summary
 * Mostrar demanda actual antes de ejecutar el algoritmo
 * Query: ?period_id=xxx
 * Solo acceso ADMIN (puede ver en cualquier fase)
 */
router.get('/demand-summary', authenticate, canViewDemand, getDemandSummaryController);

/**
 * POST /api/allocation/run
 * Ejecutar el algoritmo de asignación inteligente
 * Body: { period_id: UUID }
 * Respeta: disponibilidad de martes, máx 4 por centro, máx 16 totales, preferencias docentes
 * Solo acceso ADMIN, Solo en fase ASIGNACION
 */
router.post('/run', authenticate, canRunAllocation, runAllocation);

/**
 * GET /api/allocations
 * Listar todas las asignaciones
 * Query params: ?period_id=xxx&school_id=yyy&status=PROVISIONAL|PUBLISHED|ACCEPTED
 * Centros solo pueden ver en PUBLICACION o EJECUCION. Admin puede ver siempre.
 */
router.get('/', authenticate, canViewAllocations, listAllocations);

/**
 * POST /api/allocation/publish-all
 * ADMIN publica todas las asignaciones PROVISIONALES → PUBLISHED
 * Body: { period_id: UUID }
 * Solo en fase ASIGNACION (antes de pasar a PUBLICACION)
 */
router.post('/publish-all', authenticate, canRunAllocation, publishAllAllocations);

/**
 * PUT /api/allocation/:id/confirm
 * Centro confirma su asignación e ingresa nombres de alumnos
 * Body: { students: [ { name: "Juan", idalu: "123" }, ... ] }
 * Solo acceso CENTER_COORD - En fase PUBLICACION o EJECUCION
 */
router.put('/:id/confirm', authenticate, canViewAllocations, confirmAllocation);

/**
 * POST /api/allocation/:id/students
 * Vincular un alumno existente a una asignación
 * Body: { student_id: UUID }
 * Solo acceso CENTER_COORD - En fase PUBLICACION o EJECUCION
 */
router.post('/:id/students', authenticate, canViewAllocations, addStudentToAllocation);

/**
 * GET /api/allocation/:id
 * Detalles de una asignación
 * Centros solo pueden ver en PUBLICACION o EJECUCION. Admin puede ver siempre.
 */
router.get('/:id', authenticate, canViewAllocations, getAllocationById);

/**
 * PUT /api/allocation/:id
 * ADMIN edita una asignación (plazas asignadas)
 * Body: { assigned_seats: number }
 * Solo en fase ASIGNACION
 */
router.put('/:id', authenticate, canRunAllocation, updateAllocation);

module.exports = router;
