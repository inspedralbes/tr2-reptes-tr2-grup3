const db = require("../../config/db");

/**
 * POST /api/requests
 * Crea una nueva solicitud de taller por parte de un centro
 * Solo CENTER_COORD puede hacer esto
 * Body incluye: items (talleres) y teacher_preferences (referentes)
 */
const createRequest = async (req, res) => {
  // Validar rol: solo centros pueden solicitar
  if (req.user.role !== "CENTER_COORD") {
    return res.status(403).json({ error: "Only centers can create requests" });
  }

  const {
    enrollment_period_id,
    school_id,
    is_first_time_participation,
    available_for_tuesdays,
    items,
    teacher_preferences,
  } = req.body;

  // Validaciones
  if (!enrollment_period_id || !school_id || !items || items.length === 0) {
    return res.status(400).json({
      error: "enrollment_period_id, school_id, and items are required",
    });
  }

  // Verificar que ningún item pide más de 4 alumnos
  for (const item of items) {
    if (item.requested_students > 4) {
      return res.status(400).json({
        error: "Cannot request more than 4 students per workshop",
      });
    }
  }

  // Verificar máximo 3 preferencias docentes
  if (teacher_preferences && teacher_preferences.length > 3) {
    return res.status(400).json({
      error: "Maximum 3 teacher preferences allowed",
    });
  }

  // Usar transacción para insertar request + items + preferences atómicamente
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Crear la solicitud principal
    const reqResult = await client.query(
      `INSERT INTO requests (enrollment_period_id, school_id, is_first_time_participation, available_for_tuesdays, status, submitted_at)
       VALUES ($1, $2, $3, $4, 'SUBMITTED', NOW())
       RETURNING id, enrollment_period_id, school_id, status, submitted_at`,
      [
        enrollment_period_id,
        school_id,
        is_first_time_participation || false,
        available_for_tuesdays || false,
      ]
    );

    const request_id = reqResult.rows[0].id;

    // 2. Insertar items (talleres solicitados con número de alumnos)
    for (const item of items) {
      const itemResult = await client.query(
        `INSERT INTO request_items (request_id, workshop_edition_id, priority, requested_students)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          request_id,
          item.workshop_edition_id,
          item.priority || 999,
          item.requested_students,
        ]
      );

      const request_item_id = itemResult.rows[0].id;

      // Insertar alumnos nominativos si se proporcionan
      if (item.student_ids && item.student_ids.length > 0) {
        for (const student_id of item.student_ids) {
          // Validar UUIDs para evitar errores de SQL injection ligeros o formato
          if (student_id) {
            await client.query(
              `INSERT INTO request_item_students (request_item_id, student_id)
               VALUES ($1, $2)`,
              [request_item_id, student_id]
            );
          }
        }
      }
    }

    // 3. Insertar preferencias docentes (si existen)
    if (teacher_preferences && teacher_preferences.length > 0) {
      for (const pref of teacher_preferences) {
        await client.query(
          `INSERT INTO request_teacher_preferences (request_id, workshop_edition_id, preference_order, teacher_user_id)
           VALUES ($1, $2, $3, $4)`,
          [
            request_id,
            pref.workshop_edition_id,
            pref.preference_order,
            pref.teacher_user_id || null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      id: request_id,
      enrollment_period_id,
      school_id,
      status: "SUBMITTED",
      message: "Request created successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res
      .status(500)
      .json({ error: `Failed to create request: ${error.message}` });
  } finally {
    client.release();
  }
};

/**
 * GET /api/requests/:id
 * Obtiene una solicitud específica con sus items y preferencias docentes
 */
const getRequestById = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get Request (with global teachers)
    const rResult = await db.query(
      `SELECT r.id, r.enrollment_period_id, r.school_id, r.is_first_time_participation,
              r.available_for_tuesdays, r.status, r.submitted_at, r.request_teachers
       FROM requests r WHERE r.id = $1`,
      [id]
    );

    if (rResult.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const request = rResult.rows[0];

    // 2. Get Items (Workshops + Students)
    // Join workshop_editions -> workshops to get Title, Day, Time
    // Join request_item_students -> students to get Names
    const iResult = await db.query(
      `SELECT ri.id, ri.workshop_edition_id, ri.priority, ri.requested_students,
              w.title as workshop_title, we.day_of_week, we.start_time, we.end_time,
              (
                SELECT json_agg(json_build_object('id', s.id, 'full_name', s.full_name))
                FROM request_item_students ris
                JOIN students s ON s.id = ris.student_id
                WHERE ris.request_item_id = ri.id
              ) as students
       FROM request_items ri
       JOIN workshop_editions we ON ri.workshop_edition_id = we.id
       JOIN workshops w ON we.workshop_id = w.id
       WHERE ri.request_id = $1
       ORDER BY ri.priority`,
      [id]
    );

    // 3. Get Preferences (Priorities)
    // Join workshop_editions -> workshops
    const pResult = await db.query(
      `SELECT rtp.id, rtp.workshop_edition_id, rtp.preference_order,
              w.title as workshop_title, we.day_of_week, we.start_time, we.end_time
       FROM request_teacher_preferences rtp
       JOIN workshop_editions we ON rtp.workshop_edition_id = we.id
       JOIN workshops w ON we.workshop_id = w.id
       WHERE rtp.request_id = $1 
       ORDER BY rtp.preference_order`,
      [id]
    );

    request.items = iResult.rows;
    request.teacher_preferences = pResult.rows;

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/requests
 * Lista todas las solicitudes con filtros opcionales
 * Queryparams: ?enrollment_period_id=X&school_id=Y&status=SUBMITTED
 */
const listRequests = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let query = `
      SELECT r.id, r.submitted_at, r.status, r.enrollment_period_id,
             s.name as school_name,
             (
               SELECT json_agg(json_build_object(
                 'workshop_name', w.title,
                 'day', we.day_of_week,
                 'start_time', we.start_time,
                 'end_time', we.end_time,
                 'students', (
                    SELECT json_agg(st.full_name)
                    FROM request_item_students ris
                    JOIN students st ON st.id = ris.student_id
                    WHERE ris.request_item_id = ri.id
                 ),
                 'teachers', (
                    SELECT json_agg(u.full_name)
                    FROM request_teacher_preferences rtp
                    JOIN users u ON u.id = rtp.teacher_user_id
                    WHERE rtp.request_id = r.id AND rtp.workshop_edition_id = ri.workshop_edition_id
                 )
               ))
               FROM request_items ri
               JOIN workshop_editions we ON ri.workshop_edition_id = we.id
               JOIN workshops w ON we.workshop_id = w.id
               WHERE ri.request_id = r.id
             ) as items_summary
      FROM requests r
      JOIN schools s ON r.school_id = s.id
    `;
    const params = [];

    if (role === "CENTER_COORD") {
      // Filtrar per l'escola del coordinador
      query += ` WHERE s.coordinator_user_id = $1`;
      params.push(userId);
    }

    query += ` ORDER BY r.submitted_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error llistant sol·licituds: ${error.message}` });
  }
};

/**
 * PUT /api/requests/:id
 * Actualiza una solicitud existente (solo CENTER_COORD propietario)
 * Solo se puede modificar si está en estado SUBMITTED
 */
const updateRequest = async (req, res) => {
  if (req.user.role !== "CENTER_COORD") {
    return res.status(403).json({ error: "Only centers can update requests" });
  }

  const { id } = req.params;
  const {
    is_first_time_participation,
    available_for_tuesdays,
    items,
    teacher_preferences,
  } = req.body;

  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // Verificar que la solicitud existe y está en estado SUBMITTED
    const checkResult = await client.query(
      "SELECT id, status, school_id FROM requests WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Request not found" });
    }

    if (checkResult.rows[0].status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Cannot update request that is not in SUBMITTED status",
      });
    }

    // Actualizar campos principales
    await client.query(
      `UPDATE requests SET 
         is_first_time_participation = COALESCE($1, is_first_time_participation),
         available_for_tuesdays = COALESCE($2, available_for_tuesdays)
       WHERE id = $3`,
      [is_first_time_participation, available_for_tuesdays, id]
    );

    // Si se envían nuevos items, reemplazar los existentes
    if (items && items.length > 0) {
      // Eliminar items anteriores
      await client.query("DELETE FROM request_items WHERE request_id = $1", [
        id,
      ]);

      // Insertar nuevos items
      for (const item of items) {
        if (item.requested_students > 4) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "Cannot request more than 4 students per workshop",
          });
        }
        await client.query(
          `INSERT INTO request_items (request_id, workshop_edition_id, priority, requested_students)
           VALUES ($1, $2, $3, $4)`,
          [
            id,
            item.workshop_edition_id,
            item.priority || 999,
            item.requested_students,
          ]
        );
      }
    }

    // Si se envían nuevas preferencias docentes, reemplazar las existentes
    if (teacher_preferences) {
      if (teacher_preferences.length > 3) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Maximum 3 teacher preferences allowed" });
      }

      await client.query(
        "DELETE FROM request_teacher_preferences WHERE request_id = $1",
        [id]
      );

      for (const pref of teacher_preferences) {
        await client.query(
          `INSERT INTO request_teacher_preferences (request_id, workshop_edition_id, preference_order)
           VALUES ($1, $2, $3)`,
          [id, pref.workshop_edition_id, pref.preference_order]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Request updated successfully", id });
  } catch (error) {
    await client.query("ROLLBACK");
    res
      .status(500)
      .json({ error: `Failed to update request: ${error.message}` });
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/requests/:id
 * Cancela/elimina una solicitud (solo CENTER_COORD propietario)
 * Solo se puede cancelar si está en estado SUBMITTED
 */
const cancelRequest = async (req, res) => {
  // Permitir Admin o Center Coord
  if (req.user.role !== "CENTER_COORD" && req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Only centers or admins can cancel requests" });
  }

  const { id } = req.params;

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar estado
    const checkResult = await client.query(
      "SELECT id, status FROM requests WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Request not found" });
    }

    if (checkResult.rows[0].status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Cannot delete request that is not in SUBMITTED status",
      });
    }

    // ELIMINAR FÍSICAMENTE (Hard Delete)
    // 1. Eliminar preferencias profesor
    await client.query(
      "DELETE FROM request_teacher_preferences WHERE request_id = $1",
      [id]
    );

    // 2. Eliminar estudiantes asignados a items de esta request
    // Primero obtener los items
    const itemsRes = await client.query(
      "SELECT id FROM request_items WHERE request_id = $1",
      [id]
    );
    const itemIds = itemsRes.rows.map((r) => r.id);

    if (itemIds.length > 0) {
      await client.query(
        "DELETE FROM request_item_students WHERE request_item_id = ANY($1)",
        [itemIds]
      );
      // 3. Eliminar items
      await client.query("DELETE FROM request_items WHERE request_id = $1", [
        id,
      ]);
    }

    // 4. Eliminar request
    await client.query("DELETE FROM requests WHERE id = $1", [id]);

    await client.query("COMMIT");

    res.json({ message: "Request deleted successfully", id });
  } catch (error) {
    await client.query("ROLLBACK");
    res
      .status(500)
      .json({ error: `Failed to delete request: ${error.message}` });
  } finally {
    client.release();
  }
};

module.exports = {
  createRequest,
  getRequestById,
  listRequests,
  updateRequest,
  cancelRequest,
};
