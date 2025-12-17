/**
 * sessions/service.js
 * 
 * US #18: Generació Automàtica de Calendari
 * Servei per generar les 10 sessions d'un taller quan es publica el període
 */
const db = require('../../config/db');

/**
 * Genera les 10 sessions per a una edició de taller
 * Calcula els 10 dimarts o dijous següents segons el dia_of_week del taller
 * 
 * @param {string} workshopEditionId - ID de l'edició del taller
 * @param {Date} startDate - Data d'inici (per defecte, avui)
 * @returns {Array} Sessions creades
 */
const generateSessions = async (workshopEditionId, startDate = new Date()) => {
  try {
    // Obtenir informació de l'edició del taller
    const editionResult = await db.query(
      `SELECT id, day_of_week, start_time, end_time
       FROM workshop_editions
       WHERE id = $1`,
      [workshopEditionId]
    );

    if (editionResult.rows.length === 0) {
      throw new Error('Edició del taller no trobada');
    }

    const edition = editionResult.rows[0];
    const dayOfWeek = edition.day_of_week; // 'TUESDAY' o 'THURSDAY'

    // Mappejar dia de la setmana a número (0=diumenge, 1=dilluns, 2=dimarts, 4=dijous)
    const dayMap = {
      'TUESDAY': 2,
      'THURSDAY': 4
    };
    const targetDay = dayMap[dayOfWeek];

    if (targetDay === undefined) {
      throw new Error(`Dia de la setmana invàlid: ${dayOfWeek}`);
    }

    // Calcular les 10 dates
    const sessions = [];
    let currentDate = new Date(startDate);
    let sessionNumber = 1;

    while (sessions.length < 10) {
      // Avançar fins al proper dia objectiu
      const currentDay = currentDate.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }

      currentDate.setDate(currentDate.getDate() + daysUntilTarget);

      // Crear sessió
      const sessionDate = new Date(currentDate);
      sessions.push({
        workshop_edition_id: workshopEditionId,
        session_number: sessionNumber,
        date: sessionDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        is_cancelled: false
      });

      sessionNumber++;
      // Passar al dia següent per a la propera iteració
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Inserir sessions a la BD (en transacció)
    const client = await db.getClient();
    const createdSessions = [];

    try {
      await client.query('BEGIN');

      // Primer, eliminar sessions existents per aquesta edició (per si es regenera)
      await client.query(
        'DELETE FROM workshop_sessions WHERE workshop_edition_id = $1',
        [workshopEditionId]
      );

      // Inserir noves sessions
      for (const session of sessions) {
        const result = await client.query(
          `INSERT INTO workshop_sessions (workshop_edition_id, session_number, date, is_cancelled)
           VALUES ($1, $2, $3, $4)
           RETURNING id, workshop_edition_id, session_number, date, is_cancelled`,
          [session.workshop_edition_id, session.session_number, session.date, session.is_cancelled]
        );
        createdSessions.push(result.rows[0]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return createdSessions;
  } catch (error) {
    throw new Error(`Error generant sessions: ${error.message}`);
  }
};

/**
 * Genera sessions per a TOTES les edicions d'un període
 * Es crida automàticament quan un període passa a PUBLISHED
 * 
 * @param {string} enrollmentPeriodId - ID del període
 * @param {Date} startDate - Data d'inici per al calendari
 * @returns {Object} Resum de sessions generades
 */
const generateSessionsForPeriod = async (enrollmentPeriodId, startDate = new Date()) => {
  try {
    // Obtenir totes les edicions del període
    const editionsResult = await db.query(
      `SELECT we.id, we.day_of_week, w.title
       FROM workshop_editions we
       JOIN workshops w ON we.workshop_id = w.id
       WHERE we.enrollment_period_id = $1`,
      [enrollmentPeriodId]
    );

    const results = {
      period_id: enrollmentPeriodId,
      editions_processed: 0,
      total_sessions_created: 0,
      details: []
    };

    for (const edition of editionsResult.rows) {
      try {
        const sessions = await generateSessions(edition.id, startDate);
        results.editions_processed++;
        results.total_sessions_created += sessions.length;
        results.details.push({
          workshop_title: edition.title,
          edition_id: edition.id,
          day: edition.day_of_week,
          sessions_created: sessions.length
        });
      } catch (error) {
        results.details.push({
          workshop_title: edition.title,
          edition_id: edition.id,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Error generant sessions per al període: ${error.message}`);
  }
};

/**
 * Obtenir sessions d'una edició de taller
 * 
 * @param {string} workshopEditionId - ID de l'edició
 * @returns {Array} Llista de sessions
 */
const getSessionsByEdition = async (workshopEditionId) => {
  const result = await db.query(
    `SELECT id, workshop_edition_id, session_number, date, is_cancelled
     FROM workshop_sessions
     WHERE workshop_edition_id = $1
     ORDER BY session_number`,
    [workshopEditionId]
  );
  return result.rows;
};

/**
 * Cancel·lar o reactivar una sessió
 * 
 * @param {string} sessionId - ID de la sessió
 * @param {boolean} isCancelled - true per cancel·lar, false per reactivar
 */
const toggleSessionCancellation = async (sessionId, isCancelled) => {
  const result = await db.query(
    `UPDATE workshop_sessions
     SET is_cancelled = $1
     WHERE id = $2
     RETURNING id, workshop_edition_id, session_number, date, is_cancelled`,
    [isCancelled, sessionId]
  );

  if (result.rows.length === 0) {
    throw new Error('Sessió no trobada');
  }

  return result.rows[0];
};

module.exports = {
  generateSessions,
  generateSessionsForPeriod,
  getSessionsByEdition,
  toggleSessionCancellation,
};
