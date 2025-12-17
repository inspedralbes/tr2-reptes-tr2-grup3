/**
 * sessions/routes.js
 * 
 * US #18: Generació Automàtica de Calendari
 * Rutes per gestionar les sessions dels tallers
 */
const express = require('express');
const { authenticate } = require('../../common/middleware/authMiddleware');
const {
  generateForEdition,
  generateForPeriod,
  getByEdition,
  cancelSession,
  reactivateSession,
} = require('./controller');

const router = express.Router();

// POST - Generar sessions per a una edició de taller
router.post('/generate/:workshopEditionId', authenticate, generateForEdition);

// POST - Generar sessions per a tot un període
router.post('/generate-period/:periodId', authenticate, generateForPeriod);

// GET - Obtenir sessions d'una edició
router.get('/:workshopEditionId', authenticate, getByEdition);

// PUT - Cancel·lar una sessió
router.put('/:sessionId/cancel', authenticate, cancelSession);

// PUT - Reactivar una sessió
router.put('/:sessionId/reactivate', authenticate, reactivateSession);

module.exports = router;
