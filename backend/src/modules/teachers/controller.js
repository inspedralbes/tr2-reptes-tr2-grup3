/**
 * teachers/controller.js
 * 
 * US #17: Assignació de Referents (Admin)
 * Gestiona l'assignació de professors als tallers
 */
const db = require('../../config/db');

/**
 * GET /api/teachers/candidates/:workshopEditionId
 * Llista els professors candidats per a un taller
 * (Els que ho van demanar a les sol·licituds)
 */
const getCandidates = async (req, res) => {
  const { workshopEditionId } = req.params;

  try {
    // Obtenir professors que van demanar ser referents d'aquest taller
    // a través de request_teacher_preferences
    const result = await db.query(
      `SELECT DISTINCT 
         u.id as user_id,
         u.email,
         u.full_name,
         rtp.preference_order,
         s.name as school_name,
         r.school_id
       FROM request_teacher_preferences rtp
       JOIN requests r ON rtp.request_id = r.id
       JOIN schools s ON r.school_id = s.id
       JOIN users u ON s.coordinator_user_id = u.id
       WHERE rtp.workshop_edition_id = $1
       ORDER BY rtp.preference_order, u.full_name`,
      [workshopEditionId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: `Error obtenint candidats: ${error.message}` });
  }
};

/**
 * GET /api/teachers/assigned/:workshopEditionId
 * Llista els professors ja assignats a un taller
 */
const getAssignedTeachers = async (req, res) => {
  const { workshopEditionId } = req.params;

  try {
    const result = await db.query(
      `SELECT 
         wat.id,
         wat.teacher_user_id,
         wat.is_main_referent,
         wat.assigned_at,
         u.email,
         u.full_name
       FROM workshop_assigned_teachers wat
       JOIN users u ON wat.teacher_user_id = u.id
       WHERE wat.workshop_edition_id = $1
       ORDER BY wat.is_main_referent DESC, wat.assigned_at`,
      [workshopEditionId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: `Error obtenint professors assignats: ${error.message}` });
  }
};

/**
 * POST /api/teachers/assign
 * Assignar un professor com a referent d'un taller (només ADMIN)
 * Body: { workshop_edition_id, teacher_user_id, is_main_referent }
 */
const assignTeacher = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Només els admins poden assignar referents' });
  }

  const { workshop_edition_id, teacher_user_id, is_main_referent } = req.body;

  if (!workshop_edition_id || !teacher_user_id) {
    return res.status(400).json({ error: 'workshop_edition_id i teacher_user_id són requerits' });
  }

  try {
    // Verificar que el taller existeix
    const workshopCheck = await db.query(
      'SELECT id FROM workshop_editions WHERE id = $1',
      [workshop_edition_id]
    );
    if (workshopCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Edició del taller no trobada' });
    }

    // Verificar que l'usuari existeix
    const userCheck = await db.query(
      'SELECT id, full_name FROM users WHERE id = $1',
      [teacher_user_id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuari no trobat' });
    }

    // Comprovar si ja està assignat (constraint UNIQUE)
    const existingCheck = await db.query(
      'SELECT id FROM workshop_assigned_teachers WHERE workshop_edition_id = $1 AND teacher_user_id = $2',
      [workshop_edition_id, teacher_user_id]
    );
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Aquest professor ja està assignat a aquest taller' });
    }

    // Comprovar que no hi hagi més de 2 referents
    const countCheck = await db.query(
      'SELECT COUNT(*) as count FROM workshop_assigned_teachers WHERE workshop_edition_id = $1',
      [workshop_edition_id]
    );
    if (parseInt(countCheck.rows[0].count) >= 2) {
      return res.status(400).json({ error: 'Ja hi ha 2 referents assignats a aquest taller' });
    }

    // Assignar
    const result = await db.query(
      `INSERT INTO workshop_assigned_teachers (workshop_edition_id, teacher_user_id, is_main_referent)
       VALUES ($1, $2, $3)
       RETURNING id, workshop_edition_id, teacher_user_id, is_main_referent, assigned_at`,
      [workshop_edition_id, teacher_user_id, is_main_referent !== false]
    );

    res.status(201).json({
      message: 'Professor assignat correctament',
      assignment: {
        ...result.rows[0],
        teacher_name: userCheck.rows[0].full_name
      }
    });
  } catch (error) {
    res.status(500).json({ error: `Error assignant professor: ${error.message}` });
  }
};

/**
 * DELETE /api/teachers/assign/:assignmentId
 * Eliminar assignació d'un professor (només ADMIN)
 */
const removeAssignment = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Només els admins poden eliminar assignacions' });
  }

  const { assignmentId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM workshop_assigned_teachers WHERE id = $1 RETURNING id',
      [assignmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignació no trobada' });
    }

    res.json({ message: 'Assignació eliminada correctament' });
  } catch (error) {
    res.status(500).json({ error: `Error eliminant assignació: ${error.message}` });
  }
};

/**
 * PUT /api/teachers/assign/:assignmentId
 * Actualitzar assignació (canviar si és principal o no)
 */
const updateAssignment = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Només els admins poden modificar assignacions' });
  }

  const { assignmentId } = req.params;
  const { is_main_referent } = req.body;

  try {
    const result = await db.query(
      `UPDATE workshop_assigned_teachers
       SET is_main_referent = $1
       WHERE id = $2
       RETURNING id, workshop_edition_id, teacher_user_id, is_main_referent, assigned_at`,
      [is_main_referent, assignmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignació no trobada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: `Error actualitzant assignació: ${error.message}` });
  }
};

/**
 * GET /api/teachers/my-workshops
 * Llista els tallers on el professor actual és referent
 * Per al dashboard del professor
 */
const getMyWorkshops = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT 
         wat.id,
         wat.workshop_edition_id as edition_id,
         wat.is_main_referent,
         wat.assigned_at,
         we.day_of_week,
         we.start_time,
         we.end_time,
         we.capacity_total,
         w.title as workshop_title,
         w.description,
         w.ambit,
         ep.name as period_name
       FROM workshop_assigned_teachers wat
       JOIN workshop_editions we ON wat.workshop_edition_id = we.id
       JOIN workshops w ON we.workshop_id = w.id
       LEFT JOIN enrollment_periods ep ON we.enrollment_period_id = ep.id
       WHERE wat.teacher_user_id = $1
       ORDER BY we.day_of_week, we.start_time`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: `Error obtenint tallers: ${error.message}` });
  }
};

module.exports = {
  getCandidates,
  getAssignedTeachers,
  assignTeacher,
  removeAssignment,
  updateAssignment,
  getMyWorkshops,
};
