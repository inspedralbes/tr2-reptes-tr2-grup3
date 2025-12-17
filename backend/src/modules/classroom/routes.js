/**
 * classroom/routes.js
 * 
 * Rutas para el módulo de aula virtual.
 * Endpoints para sesiones, alumnos, asistencia y evaluaciones.
 */
const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { 
  listSessions, 
  getStudentsForEdition,
  saveAttendance,
  getAttendance,
  saveEvaluations,
  getEvaluations
} = require('./controller');

const router = express.Router();

// Sesiones
router.get('/sessions', authenticate, listSessions);
router.get('/sessions/:editionId', authenticate, listSessions);

// Alumnos de una edición
router.get('/students/:editionId', authenticate, getStudentsForEdition);

// Asistencia
router.post('/attendance/:sessionId', authenticate, saveAttendance);
router.get('/attendance/:sessionId', authenticate, getAttendance);

// Evaluaciones
router.post('/evaluations/:editionId', authenticate, saveEvaluations);
router.get('/evaluations/:editionId', authenticate, getEvaluations);

module.exports = router;
