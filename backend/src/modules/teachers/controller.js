/**
 * teachers/controller.js
 *
 * US #17: Assignació de Referents
 * Gestiona l'assignació de professors als tallers
 *
 * UPDATE: Ara els professors NO són usuaris (sense login)
 * Es gestionen a la taula 'teachers'
 */
const db = require("../../config/db");

/**
 * GET /api/teachers/candidates/:workshopEditionId
 * Llista els professors candidats per a un taller
 */
const getCandidates = async (req, res) => {
  const { workshopEditionId } = req.params;

  try {
    const result = await db.query(
      `SELECT DISTINCT 
         t.id as teacher_id,
         t.email,
         t.full_name,
         rtp.preference_order,
         s.name as school_name
       FROM request_teacher_preferences rtp
       JOIN requests r ON rtp.request_id = r.id
       JOIN schools s ON r.school_id = s.id
       JOIN teachers t ON rtp.teacher_id = t.id
       WHERE rtp.workshop_edition_id = $1
       ORDER BY rtp.preference_order, t.full_name`,
      [workshopEditionId]
    );

    res.json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error obtenint candidats: ${error.message}` });
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
         wat.teacher_id,
         wat.is_main_referent,
         wat.assigned_at,
         t.email,
         t.full_name
       FROM workshop_assigned_teachers wat
       JOIN teachers t ON wat.teacher_id = t.id
       WHERE wat.workshop_edition_id = $1
       ORDER BY wat.is_main_referent DESC, wat.assigned_at`,
      [workshopEditionId]
    );

    res.json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error obtenint professors assignats: ${error.message}` });
  }
};

/**
 * POST /api/teachers/assign
 * Assignar un professor com a referent d'un taller (només ADMIN)
 */
const assignTeacher = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Només els admins poden assignar referents" });
  }

  const { workshop_edition_id, teacher_id, is_main_referent } = req.body;

  if (!workshop_edition_id || !teacher_id) {
    return res
      .status(400)
      .json({ error: "workshop_edition_id i teacher_id són requerits" });
  }

  try {
    // Verificar que el taller existeix
    const workshopCheck = await db.query(
      "SELECT id FROM workshop_editions WHERE id = $1",
      [workshop_edition_id]
    );
    if (workshopCheck.rows.length === 0) {
      return res.status(404).json({ error: "Edició del taller no trobada" });
    }

    // Verificar que el professor existeix (ara taula teachers)
    const teacherCheck = await db.query(
      "SELECT id, full_name FROM teachers WHERE id = $1",
      [teacher_id]
    );
    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ error: "Professor no trobat" });
    }

    // Comprovar si ja està assignat (constraint UNIQUE)
    const existingCheck = await db.query(
      "SELECT id FROM workshop_assigned_teachers WHERE workshop_edition_id = $1 AND teacher_id = $2",
      [workshop_edition_id, teacher_id]
    );
    if (existingCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Aquest professor ja està assignat a aquest taller" });
    }

    // Comprovar que no hi hagi més de 2 referents
    const countCheck = await db.query(
      "SELECT COUNT(*) as count FROM workshop_assigned_teachers WHERE workshop_edition_id = $1",
      [workshop_edition_id]
    );
    if (parseInt(countCheck.rows[0].count) >= 2) {
      return res
        .status(400)
        .json({ error: "Ja hi ha 2 referents assignats a aquest taller" });
    }

    // =========================================================================
    // LOGICA AUTOMATICA: Crear Usuario y Enviar Email (ELIMINADA)
    // =========================================================================
    // Ara es fa manualment des del botó "Enviar Credencials"
    // =========================================================================

    // Assignar
    const result = await db.query(
      `INSERT INTO workshop_assigned_teachers (workshop_edition_id, teacher_id, is_main_referent)
       VALUES ($1, $2, $3)
       RETURNING id, workshop_edition_id, teacher_id, is_main_referent, assigned_at`,
      [workshop_edition_id, teacher_id, is_main_referent !== false]
    );

    res.status(201).json({
      message: "Professor assignat correctament",
      assignment: {
        ...result.rows[0],
        teacher_name: teacherCheck.rows[0].full_name,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error assignant professor: ${error.message}` });
  }
};

/**
 * DELETE /api/teachers/assign/:assignmentId
 * Eliminar assignació d'un professor (només ADMIN)
 */
const removeAssignment = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Només els admins poden eliminar assignacions" });
  }

  const { assignmentId } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM workshop_assigned_teachers WHERE id = $1 RETURNING id",
      [assignmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignació no trobada" });
    }

    res.json({ message: "Assignació eliminada correctament" });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error eliminant assignació: ${error.message}` });
  }
};

/**
 * PUT /api/teachers/assign/:assignmentId
 * Actualitzar assignació (canviar si és principal o no)
 */
const updateAssignment = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Només els admins poden modificar assignacions" });
  }

  const { assignmentId } = req.params;
  const { is_main_referent } = req.body;

  try {
    const result = await db.query(
      `UPDATE workshop_assigned_teachers
       SET is_main_referent = $1
       WHERE id = $2
       RETURNING id, workshop_edition_id, teacher_id, is_main_referent, assigned_at`,
      [is_main_referent, assignmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignació no trobada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error actualitzant assignació: ${error.message}` });
  }
};

/**
 * GET /api/teachers/my-workshops
 * DEPRECATED - Els professors no tenen usuari per veure els seus tallers
 */
const getMyWorkshops = async (req, res) => {
  return res.status(410).json({
    error:
      "This feature is no longer supported as teachers do not have accounts.",
  });
};

/**
 * GET /api/teachers
 * Llista els professors del centre del coordinador actual
 */
/**
 * GET /api/teachers
 * Llista els professors del centre del coordinador actual
 */
const getByCenter = async (req, res) => {
  try {
    // Modificación: Buscar el School ID basado en el usuario coordinador logueado
    const teacherResult = await db.query(
      "SELECT id FROM schools WHERE coordinator_user_id = $1",
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Escola no trobada per a aquest usuari" });
    }
    const schoolId = teacherResult.rows[0].id;

    const result = await db.query(
      `SELECT id, full_name, email, phone_number, created_at 
       FROM teachers 
       WHERE school_id = $1
       ORDER BY full_name`,
      [schoolId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/teachers
 * Crea un nou professor pel centre del coordinador actual (Sense password)
 */
const create = async (req, res) => {
  try {
    // Buscar school_id
    const teacherResult = await db.query(
      "SELECT id FROM schools WHERE coordinator_user_id = $1",
      [req.user.id]
    );
    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: "Escola no trobada" });
    }
    const schoolId = teacherResult.rows[0].id;

    const { full_name, email, phone_number } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: "Faltan camps obligatoris (Nom)" });
    }

    const result = await db.query(
      `INSERT INTO teachers (full_name, email, phone_number, school_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, phone_number, created_at`,
      [full_name, email, phone_number, schoolId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar school_id
    const teacherResult = await db.query(
      "SELECT id FROM schools WHERE coordinator_user_id = $1",
      [req.user.id]
    );
    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: "Escola no trobada" });
    }
    const schoolId = teacherResult.rows[0].id;

    const { full_name, email, phone_number } = req.body;

    // Verificar que el profe pertany al centre (ara taula teachers)
    const check = await db.query(
      "SELECT id FROM teachers WHERE id = $1 AND school_id = $2",
      [id, schoolId]
    );
    if (check.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Professor no trobat o no pertany a la teva escola" });
    }

    const result = await db.query(
      `UPDATE teachers 
       SET full_name = $1, email = $2, phone_number = $3
       WHERE id = $4 
       RETURNING id, full_name, email, phone_number`,
      [full_name, email, phone_number, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/teachers/:id
 * Actualitza dades d'un professor
 */


/**
 * DELETE /api/teachers/:id
 * Elimina un professor
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar school_id
    const teacherResult = await db.query(
      "SELECT id FROM schools WHERE coordinator_user_id = $1",
      [req.user.id]
    );
    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: "Escola no trobada" });
    }
    const schoolId = teacherResult.rows[0].id;

    const result = await db.query(
      "DELETE FROM teachers WHERE id = $1 AND school_id = $2 RETURNING id",
      [id, schoolId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Professor no trobat" });
    }

    res.json({ message: "Professor eliminat" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/teachers/:id/send-credentials
 * Enviar credencials manualment a un professor
 */
const sendCredentials = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Obtener datos del profesor
    const teacherCheck = await db.query(
      "SELECT id, full_name, email, user_id FROM teachers WHERE id = $1",
      [id]
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ error: "Professor no trobat" });
    }

    const teacher = teacherCheck.rows[0];

    if (!teacher.email) {
      return res.status(400).json({ error: "El professor no té email" });
    }

    // 2. Comprovar si té usuari
    let userId = teacher.user_id;
    // For testing we set a deterministic password so it's easier to access accounts
    // DO NOT use in production. Password set to 'admin123' as requested.
    let generatedPassword = 'admin123';

    // Si NO tiene usuario, CREARLO
    if (!userId) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Insertar usuario
      const newUser = await db.query(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'TEACHER') RETURNING id",
        [teacher.full_name, teacher.email, hashedPassword]
      );
      userId = newUser.rows[0].id;

      // Vincular usuario al profesor
      await db.query(
        "UPDATE teachers SET user_id = $1 WHERE id = $2",
        [userId, id]
      );
    } else {
      // Si YA tiene usuario, ACTUALIZAR password para enviarle uno nuevo
      // Opcional: Podríamos no cambiarlo, pero si enviamos credenciales, mejor que funcionen las que enviamos.
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      await db.query(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        [hashedPassword, userId]
      );
    }

    // 3. Enviar Email
    const emailService = require('../../common/services/EmailService');
      // Optionally send email. For testing we can skip sending (password is known).
      let sent = { success: true };
      try {
        sent = await emailService.sendTeacherCredentials(teacher.email, generatedPassword, teacher.full_name);
      } catch (e) {
        // If email fails, we still return success because password is deterministic for testing
        console.warn('Email send failed (testing):', e.message || e);
        sent = { success: false };
      }

    // Return the password so UI or caller can display it when appropriate (only for testing)
    res.json({ message: "Credencials generades", password: generatedPassword, email_sent: !!sent.success });

  } catch (error) {
    res.status(500).json({ error: `Error enviant credencials: ${error.message}` });
  }
};

module.exports = {
  getCandidates,
  getAssignedTeachers,
  assignTeacher,
  removeAssignment,
  updateAssignment,
  getMyWorkshops,
  getByCenter,
  create,
  update,
  remove,
  sendCredentials,
};
