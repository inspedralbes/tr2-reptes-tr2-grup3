const db = require('../../config/db');

/**
 * POST /api/requests
 * Crea una nueva solicitud de taller por parte de un centro
 * Solo CENTER_COORD puede hacer esto
 * Body incluye: items (talleres) y teacher_preferences (referentes)
 */
const createRequest = async (req, res) => {
  // Validar rol: solo centros pueden solicitar
  if (req.user.role !== 'CENTER_COORD') {
    return res.status(403).json({ error: 'Only centers can create requests' });
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
      error: 'enrollment_period_id, school_id, and items are required',
    });
  }

  // Verificar que ningún item pide más de 4 alumnos
  for (const item of items) {
    if (item.requested_students > 4) {
      return res.status(400).json({
        error: 'Cannot request more than 4 students per workshop',
      });
    }
  }

  // Verificar máximo 3 preferencias docentes
  if (teacher_preferences && teacher_preferences.length > 3) {
    return res.status(400).json({
      error: 'Maximum 3 teacher preferences allowed',
    });
  }

  // Usar transacción para insertar request + items + preferences atómicamente
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Crear la solicitud principal
    const reqResult = await client.query(
      `INSERT INTO requests (enrollment_period_id, school_id, is_first_time_participation, available_for_tuesdays, status, submitted_at)
       VALUES ($1, $2, $3, $4, 'SUBMITTED', NOW())
       RETURNING id, enrollment_period_id, school_id, status, submitted_at`,
      [enrollment_period_id, school_id, is_first_time_participation || false, available_for_tuesdays || false]
    );

    const request_id = reqResult.rows[0].id;

    // 2. Insertar items (talleres solicitados con número de alumnos)
    for (const item of items) {
      await client.query(
        `INSERT INTO request_items (request_id, workshop_edition_id, priority, requested_students)
         VALUES ($1, $2, $3, $4)`,
        [request_id, item.workshop_edition_id, item.priority || 999, item.requested_students]
      );
    }

    // 3. Insertar preferencias docentes (si existen)
    if (teacher_preferences && teacher_preferences.length > 0) {
      for (const pref of teacher_preferences) {
        await client.query(
          `INSERT INTO request_teacher_preferences (request_id, workshop_edition_id, preference_order)
           VALUES ($1, $2, $3)`,
          [request_id, pref.workshop_edition_id, pref.preference_order]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: request_id,
      enrollment_period_id,
      school_id,
      status: 'SUBMITTED',
      message: 'Request created successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: `Failed to create request: ${error.message}` });
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
    // Obtener solicitud
    const rResult = await db.query(
      `SELECT id, enrollment_period_id, school_id, is_first_time_participation,
              available_for_tuesdays, status, submitted_at
       FROM requests WHERE id = $1`,
      [id]
    );

    if (rResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = rResult.rows[0];

    // Obtener items (talleres solicitados)
    const iResult = await db.query(
      `SELECT id, workshop_edition_id, priority, requested_students
       FROM request_items WHERE request_id = $1 ORDER BY priority`,
      [id]
    );

    // Obtener preferencias docentes (referentes)
    const pResult = await db.query(
      `SELECT id, workshop_edition_id, preference_order
       FROM request_teacher_preferences WHERE request_id = $1 ORDER BY preference_order`,
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
  const { enrollment_period_id, school_id, status } = req.query;

  try {
    let query = 'SELECT id, enrollment_period_id, school_id, status, submitted_at FROM requests WHERE 1=1';
    const params = [];

    if (enrollment_period_id) {
      params.push(enrollment_period_id);
      query += ` AND enrollment_period_id = $${params.length}`;
    }

    if (school_id) {
      params.push(school_id);
      query += ` AND school_id = $${params.length}`;
    }

    if (status) {
      params.push(status.toUpperCase());
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY submitted_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRequest,
  getRequestById,
  listRequests,
};
