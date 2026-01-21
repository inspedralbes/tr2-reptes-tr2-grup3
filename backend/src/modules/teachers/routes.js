/**
 * teachers/routes.js
 * 
 * US #17: Assignació de Referents
 * Rutes per gestionar l'assignació de professors als tallers
 */
const express = require('express');
const { authenticate, isAuthenticated, isCenterCoord } = require('../../common/middleware/authMiddleware');
const { requirePhase } = require('../../common/middleware/phaseMiddleware');
const teacherController = require('./controller'); // Changed to import the whole controller

const router = express.Router();

// Middleware per gestió de professors en fase correcta
const canManageTeachers = requirePhase(['PUBLICACION', 'EJECUCION'], { adminBypass: true });
const canViewTeacherWorkshops = requirePhase(['PUBLICACION', 'EJECUCION'], { adminBypass: true });

// Rutes per al PROFESSOR (veure els seus tallers) - Només quan publicats
router.get('/my-workshops', isAuthenticated, canViewTeacherWorkshops, teacherController.getMyWorkshops);

// Rutes per al COORDINADOR (gestionar els seus professors) - Disponible sempre per preparar llista
router.get('/', isAuthenticated, isCenterCoord, teacherController.getByCenter);
router.post('/', isAuthenticated, isCenterCoord, teacherController.create);
router.put('/:id', isAuthenticated, isCenterCoord, teacherController.update);
router.delete('/:id', isAuthenticated, isCenterCoord, teacherController.remove);

// GET - Obtenir candidats per a un taller (profes que ho van demanar) - Post-publicació
router.get('/candidates/:workshopEditionId', authenticate, canManageTeachers, teacherController.getCandidates);

// GET - Obtenir professors ja assignats a un taller - Post-publicació
router.get('/assigned/:workshopEditionId', authenticate, canManageTeachers, teacherController.getAssignedTeachers);

// POST - Assignar professor a un taller (només ADMIN) - Post-publicació
router.post('/assign', authenticate, canManageTeachers, teacherController.assignTeacher);

// PUT - Actualitzar assignació
router.put('/assign/:assignmentId', authenticate, canManageTeachers, teacherController.updateAssignment);

// DELETE - Eliminar assignació (només ADMIN)
router.delete('/assign/:assignmentId', authenticate, canManageTeachers, teacherController.removeAssignment);

module.exports = router;
