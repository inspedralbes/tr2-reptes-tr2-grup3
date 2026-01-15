/**
 * teachers/routes.js
 * 
 * US #17: Assignació de Referents
 * Rutes per gestionar l'assignació de professors als tallers
 */
const express = require('express');
const { authenticate, isAuthenticated, isCenterCoord } = require('../../common/middleware/authMiddleware');
const teacherController = require('./controller'); // Changed to import the whole controller

const router = express.Router();

// Rutes per al PROFESSOR (veure els seus tallers)
router.get('/my-workshops', isAuthenticated, teacherController.getMyWorkshops);

// Rutes per al COORDINADOR (gestionar els seus professors)
router.get('/', isAuthenticated, isCenterCoord, teacherController.getByCenter);
router.post('/', isAuthenticated, isCenterCoord, teacherController.create);
router.put('/:id', isAuthenticated, isCenterCoord, teacherController.update);
router.delete('/:id', isAuthenticated, isCenterCoord, teacherController.remove);

// GET - Obtenir candidats per a un taller (profes que ho van demanar)
router.get('/candidates/:workshopEditionId', authenticate, teacherController.getCandidates);

// GET - Obtenir professors ja assignats a un taller
router.get('/assigned/:workshopEditionId', authenticate, teacherController.getAssignedTeachers);

// POST - Assignar professor a un taller (només ADMIN)
router.post('/assign', authenticate, teacherController.assignTeacher);

// PUT - Actualitzar assignació
router.put('/assign/:assignmentId', authenticate, teacherController.updateAssignment);

// DELETE - Eliminar assignació (només ADMIN)
router.delete('/assign/:assignmentId', authenticate, teacherController.removeAssignment);

module.exports = router;
