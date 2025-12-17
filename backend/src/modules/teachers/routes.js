/**
 * teachers/routes.js
 * 
 * US #17: Assignació de Referents
 * Rutes per gestionar l'assignació de professors als tallers
 */
const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const {
  getCandidates,
  getAssignedTeachers,
  assignTeacher,
  removeAssignment,
  updateAssignment,
  getMyWorkshops,
} = require('./controller');

const router = express.Router();

// GET - Obtenir els tallers del professor actual (ZONA PROFESSOR)
router.get('/my-workshops', authenticate, getMyWorkshops);

// GET - Obtenir candidats per a un taller (profes que ho van demanar)
router.get('/candidates/:workshopEditionId', authenticate, getCandidates);

// GET - Obtenir professors ja assignats a un taller
router.get('/assigned/:workshopEditionId', authenticate, getAssignedTeachers);

// POST - Assignar professor a un taller (només ADMIN)
router.post('/assign', authenticate, assignTeacher);

// PUT - Actualitzar assignació
router.put('/assign/:assignmentId', authenticate, updateAssignment);

// DELETE - Eliminar assignació (només ADMIN)
router.delete('/assign/:assignmentId', authenticate, removeAssignment);

module.exports = router;
