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

/**
 * PUT /api/requests/:id
 * Actualiza una solicitud existente (solo CENTER_COORD propietario)
 * Solo se puede modificar si está en estado SUBMITTED
 */
const updateRequest = async (req, res) => {
  if (req.user.role !== 'CENTER_COORD') {
    return res.status(403).json({ error: 'Only centers can update requests' });
  }

  const { id } = req.params;
  const { is_first_time_participation, available_for_tuesdays, items, teacher_preferences } = req.body;

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Verificar que la solicitud existe y está en estado SUBMITTED
    const checkResult = await client.query(
      'SELECT id, status, school_id FROM requests WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    if (checkResult.rows[0].status !== 'SUBMITTED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot update request that is not in SUBMITTED status' });
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
      await client.query('DELETE FROM request_items WHERE request_id = $1', [id]);
      
      // Insertar nuevos items
      for (const item of items) {
        if (item.requested_students > 4) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Cannot request more than 4 students per workshop' });
        }
        await client.query(
          `INSERT INTO request_items (request_id, workshop_edition_id, priority, requested_students)
           VALUES ($1, $2, $3, $4)`,
          [id, item.workshop_edition_id, item.priority || 999, item.requested_students]
        );
      }
    }

    // Si se envían nuevas preferencias docentes, reemplazar las existentes
    if (teacher_preferences) {
      if (teacher_preferences.length > 3) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Maximum 3 teacher preferences allowed' });
      }
      
      await client.query('DELETE FROM request_teacher_preferences WHERE request_id = $1', [id]);
      
      for (const pref of teacher_preferences) {
        await client.query(
          `INSERT INTO request_teacher_preferences (request_id, workshop_edition_id, preference_order)
           VALUES ($1, $2, $3)`,
          [id, pref.workshop_edition_id, pref.preference_order]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Request updated successfully', id });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: `Failed to update request: ${error.message}` });
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
  if (req.user.role !== 'CENTER_COORD') {
    return res.status(403).json({ error: 'Only centers can cancel requests' });
  }

  const { id } = req.params;

  try {
    // Verificar que la solicitud existe y está en estado SUBMITTED
    const checkResult = await db.query(
      'SELECT id, status FROM requests WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (checkResult.rows[0].status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Cannot cancel request that is not in SUBMITTED status' });
    }

    // Cambiar estado a CANCELLED en lugar de eliminar (para auditoría)
    await db.query(
      `UPDATE requests SET status = 'CANCELLED' WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Request cancelled successfully', id });
  } catch (error) {
    res.status(500).json({ error: `Failed to cancel request: ${error.message}` });
  }
};

module.exports = {
  createRequest,
  getRequestById,
  listRequests,
  updateRequest,
  cancelRequest,
};
