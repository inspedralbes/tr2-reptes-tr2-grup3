/**
 * sessions/controller.js
 * 
 * US #18: Generació Automàtica de Calendari
 * Controller per gestionar les sessions dels tallers
 */
const sessionsService = require('./service');

/**
 * POST /api/sessions/generate/:workshopEditionId
 * Generar 10 sessions per a una edició de taller específica
 */
const generateForEdition = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Només els admins poden generar sessions' });
  }

  const { workshopEditionId } = req.params;
  const { start_date } = req.body;

  try {
    const startDate = start_date ? new Date(start_date) : new Date();
    const sessions = await sessionsService.generateSessions(workshopEditionId, startDate);

    res.status(201).json({
      message: 'Sessions generades correctament',
      sessions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/sessions/generate-period/:periodId
 * Generar sessions per a TOTES les edicions d'un període
 */
const generateForPeriod = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Només els admins poden generar sessions' });
  }

  const { periodId } = req.params;
  const { start_date } = req.body;

  try {
    const startDate = start_date ? new Date(start_date) : new Date();
    const result = await sessionsService.generateSessionsForPeriod(periodId, startDate);

    res.status(201).json({
      message: 'Sessions generades per a tot el període',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/sessions/:workshopEditionId
 * Obtenir sessions d'una edició de taller
 */
const getByEdition = async (req, res) => {
  const { workshopEditionId } = req.params;

  try {
    const sessions = await sessionsService.getSessionsByEdition(workshopEditionId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/sessions/:sessionId/cancel
 * Cancel·lar una sessió
 */
const cancelSession = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Només els admins poden cancel·lar sessions' });
  }

  const { sessionId } = req.params;

  try {
    const session = await sessionsService.toggleSessionCancellation(sessionId, true);
    res.json({
      message: 'Sessió cancel·lada',
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/sessions/:sessionId/reactivate
 * Reactivar una sessió cancel·lada
 */
const reactivateSession = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Només els admins poden reactivar sessions' });
  }

  const { sessionId } = req.params;

  try {
    const session = await sessionsService.toggleSessionCancellation(sessionId, false);
    res.json({
      message: 'Sessió reactivada',
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  generateForEdition,
  generateForPeriod,
  getByEdition,
  cancelSession,
  reactivateSession,
};
