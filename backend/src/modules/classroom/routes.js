/**
 * classroom/routes.js
 * 
 * Rutas para el módulo de aula virtual.
 * Endpoints para sesiones, alumnos, asistencia y evaluaciones.
 * 
 * RESTRICCIÓN DE FASE: Solo disponible en EJECUCION
 * RESTRICCIÓN DE ROL: Solo TEACHER (profesores referentes) y ADMIN
 */
const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { canManageAttendance } = require('../../common/middleware/phaseMiddleware');
const { 
  getMyWorkshops,
  listSessions, 
  getStudentsForEdition,
  saveAttendance,
  getAttendance,
  saveEvaluations,
  getEvaluations,
  getStudentNotes,
  saveStudentNote,
  getWorkshopStats
} = require('./controller');

const router = express.Router();

// Talleres asignados al profesor - Solo TEACHER en EJECUCION
router.get('/my-workshops', authenticate, canManageAttendance, getMyWorkshops);

// Sesiones - Solo TEACHER en EJECUCION
router.get('/sessions', authenticate, canManageAttendance, listSessions);
router.get('/sessions/:editionId', authenticate, canManageAttendance, listSessions);

// Alumnos de una edición - Solo TEACHER en EJECUCION
router.get('/students/:editionId', authenticate, canManageAttendance, getStudentsForEdition);

// Asistencia - Solo TEACHER en EJECUCION (profesores pasan lista)
router.post('/attendance/:sessionId', authenticate, canManageAttendance, saveAttendance);
router.get('/attendance/:sessionId', authenticate, canManageAttendance, getAttendance);

// Evaluaciones - Solo TEACHER en EJECUCION
router.post('/evaluations/:editionId', authenticate, canManageAttendance, saveEvaluations);
router.get('/evaluations/:editionId', authenticate, canManageAttendance, getEvaluations);

// Notas del profesor sobre alumnos - Solo TEACHER en EJECUCION
router.get('/notes/:editionId', authenticate, canManageAttendance, getStudentNotes);
router.post('/notes/:editionId/:studentId', authenticate, canManageAttendance, saveStudentNote);

// Estadísticas del taller - Solo TEACHER en EJECUCION
router.get('/stats/:editionId', authenticate, canManageAttendance, getWorkshopStats);

module.exports = router;
