const db = require('../../config/db');

/**
 * GET /api/catalog/workshops
 * Lista todos los talleres disponibles con filtros opcionales
 * Query params: ?ambit=Tecnologic&is_new=true
 * El frontend puede filtrar por ámbito (Tecnológic, Artístic, Sostenibilitat, etc.)
 */
const listWorkshops = async (req, res) => {
  const { ambit, is_new } = req.query;

  try {
    let query = 'SELECT id, title, ambit, is_new, description, provider_id FROM workshops WHERE 1=1';
    const params = [];

    // Filtro por ámbito
    if (ambit) {
      params.push(ambit);
      query += ` AND ambit = $${params.length}`;
    }

    // Filtro por si es nuevo
    if (is_new !== undefined) {
      params.push(is_new === 'true');
      query += ` AND is_new = $${params.length}`;
    }

    query += ' ORDER BY title';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/catalog/workshops/:id
 * Obtiene un taller específico junto con todas sus ediciones
 * Retorna: workshop + array de ediciones (día, horario, capacidad, etc.)
 */
const getWorkshop = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener workshop
    const workshopResult = await db.query(
      'SELECT id, title, ambit, is_new, description, provider_id FROM workshops WHERE id = $1',
      [id]
    );

    if (workshopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workshop not found' });
    }

    const workshop = workshopResult.rows[0];

    // Obtener ediciones del workshop
    const editionsResult = await db.query(
      `SELECT id, enrollment_period_id, day_of_week, start_time, end_time, 
              capacity_total, max_per_school 
       FROM workshop_editions 
       WHERE workshop_id = $1 
       ORDER BY day_of_week, start_time`,
      [id]
    );

    res.json({
      ...workshop,
      editions: editionsResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/catalog/workshops
 * Crea un nuevo taller
 * Solo ADMIN
 * Body: { title, ambit, is_new, description, provider_id }
 */
const createWorkshop = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create workshops' });
  }

  const { title, ambit, is_new, description, provider_id } = req.body;

  // Validar campos requeridos
  if (!title || !ambit) {
    return res.status(400).json({ error: 'title and ambit are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO workshops (title, ambit, is_new, description, provider_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, ambit, is_new, description, provider_id`,
      [title, ambit, is_new || false, description || null, provider_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * PUT /api/catalog/workshops/:id
 * Actualiza un taller existente
 * Solo ADMIN
 * Body: { title?, ambit?, is_new?, description?, provider_id? }
 */
const updateWorkshop = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can update workshops' });
  }

  const { id } = req.params;
  const { title, ambit, is_new, description, provider_id } = req.body;

  try {
    // Verificar que el workshop existe
    const checkResult = await db.query('SELECT id FROM workshops WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workshop not found' });
    }

    // Construir UPDATE dinámico
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      params.push(title);
      paramCount++;
    }
    if (ambit !== undefined) {
      updates.push(`ambit = $${paramCount}`);
      params.push(ambit);
      paramCount++;
    }
    if (is_new !== undefined) {
      updates.push(`is_new = $${paramCount}`);
      params.push(is_new);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (provider_id !== undefined) {
      updates.push(`provider_id = $${paramCount}`);
      params.push(provider_id);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE workshops SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * DELETE /api/catalog/workshops/:id
 * Elimina un taller
 * Solo ADMIN
 * Precondición: no debe tener ediciones asociadas con solicitudes
 */
const deleteWorkshop = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete workshops' });
  }

  const { id } = req.params;

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Verificar que existe
    const checkResult = await client.query('SELECT id FROM workshops WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      throw new Error('Workshop not found');
    }

    // Verificar que no tiene ediciones con solicitudes activas
    const activeRequestsResult = await client.query(
      `SELECT COUNT(*) as count FROM request_items ri
       JOIN workshop_editions we ON ri.workshop_edition_id = we.id
       WHERE we.workshop_id = $1`,
      [id]
    );

    if (parseInt(activeRequestsResult.rows[0].count) > 0) {
      throw new Error('Cannot delete workshop with active requests');
    }

    // Eliminar ediciones
    await client.query('DELETE FROM workshop_editions WHERE workshop_id = $1', [id]);

    // Eliminar workshop
    const result = await client.query(
      'DELETE FROM workshops WHERE id = $1 RETURNING id, title',
      [id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Workshop deleted successfully',
      deleted: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  listWorkshops,
  getWorkshop,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
};
