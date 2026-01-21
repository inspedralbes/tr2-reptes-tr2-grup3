/**
 * classroom/routes.js
 * 
 * Rutas para el módulo de aula virtual.
 * Endpoints para sesiones, alumnos, asistencia y evaluaciones.
 * 
 * RESTRICCIÓN DE FASE: Solo disponible en EJECUCION
 */
const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { canManageAttendance } = require('../../common/middleware/phaseMiddleware');
const { 
  listSessions, 
  getStudentsForEdition,
  saveAttendance,
  getAttendance,
  saveEvaluations,
  getEvaluations
} = require('./controller');

const router = express.Router();

// Sesiones - Solo en EJECUCION
router.get('/sessions', authenticate, canManageAttendance, listSessions);
router.get('/sessions/:editionId', authenticate, canManageAttendance, listSessions);

// Alumnos de una edición - Solo en EJECUCION
router.get('/students/:editionId', authenticate, canManageAttendance, getStudentsForEdition);

// Asistencia - Solo en EJECUCION
router.post('/attendance/:sessionId', authenticate, canManageAttendance, saveAttendance);
router.get('/attendance/:sessionId', authenticate, canManageAttendance, getAttendance);

// Evaluaciones - Solo en EJECUCION
router.post('/evaluations/:editionId', authenticate, canManageAttendance, saveEvaluations);
router.get('/evaluations/:editionId', authenticate, canManageAttendance, getEvaluations);

module.exports = router;
