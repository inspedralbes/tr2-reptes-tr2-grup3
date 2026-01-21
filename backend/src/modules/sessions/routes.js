/**
 * sessions/routes.js
 * 
 * US #18: Generació Automàtica de Calendari
 * Rutes per gestionar les sessions dels tallers
 */
const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const { requirePhase } = require('../../common/middleware/phaseMiddleware');
const {
  generateForEdition,
  generateForPeriod,
  getByEdition,
  cancelSession,
  reactivateSession,
} = require('./controller');

const router = express.Router();

// Generar sessions solo después de asignación (PUBLICACION, EJECUCION)
const canManageSessions = requirePhase(['PUBLICACION', 'EJECUCION'], { adminBypass: true });

// POST - Generar sessions per a una edició de taller
router.post('/generate/:workshopEditionId', authenticate, canManageSessions, generateForEdition);

// POST - Generar sessions per a tot un període
router.post('/generate-period/:periodId', authenticate, canManageSessions, generateForPeriod);

// GET - Obtenir sessions d'una edició (visible después de publicación)
router.get('/:workshopEditionId', authenticate, canManageSessions, getByEdition);

// PUT - Cancel·lar una sessió (solo en ejecución)
router.put('/:sessionId/cancel', authenticate, canManageSessions, cancelSession);

// PUT - Reactivar una sessió (solo en ejecución)
router.put('/:sessionId/reactivate', authenticate, canManageSessions, reactivateSession);

module.exports = router;
