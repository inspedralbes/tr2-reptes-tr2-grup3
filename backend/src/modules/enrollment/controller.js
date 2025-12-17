const db = require('../../config/db');

/**
 * GET /api/enrollment/periods
 * Lista todos los períodos de matrícula disponibles
 * Filtra por estado si se proporciona query param ?status=OPEN
 */
const listEnrollmentPeriods = async (req, res) => {
  const { status } = req.query;

  try {
    let query = 'SELECT id, name, start_date_requests, end_date_requests, publication_date, status, created_at FROM enrollment_periods';
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      query += ` WHERE status = $1`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch periods: ${error.message}` });
  }
};

/**
 * GET /api/enrollment/periods/:id
 * Obtiene un período específico con su información completa
 */
const getPeriodById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT id, name, start_date_requests, end_date_requests, publication_date, status, created_at FROM enrollment_periods WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Period not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch period: ${error.message}` });
  }
};

/**
 * POST /api/enrollment/periods
 * Crea un nuevo período de matrícula (solo ADMIN)
 * Body: { name, start_date_requests, end_date_requests }
 */
const createPeriod = async (req, res) => {
  // Verificar que el usuario es admin
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create periods' });
  }

  const { name, start_date_requests, end_date_requests } = req.body;

  // Validación
  if (!name || !start_date_requests || !end_date_requests) {
    return res.status(400).json({ 
      error: 'name, start_date_requests, and end_date_requests are required' 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO enrollment_periods (name, start_date_requests, end_date_requests, status)
       VALUES ($1, $2, $3, 'OPEN')
       RETURNING id, name, start_date_requests, end_date_requests, status, created_at`,
      [name, start_date_requests, end_date_requests]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: `Failed to create period: ${error.message}` });
  }
};

/**
 * PUT /api/enrollment/periods/:id
 * Actualiza un período (solo ADMIN)
 * Permite cambiar: name, start_date_requests, end_date_requests, status
 */
const updatePeriod = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can update periods' });
  }

  const { id } = req.params;
  const { name, start_date_requests, end_date_requests, status } = req.body;

  try {
    const result = await db.query(
      `UPDATE enrollment_periods 
       SET name = COALESCE($1, name),
           start_date_requests = COALESCE($2, start_date_requests),
           end_date_requests = COALESCE($3, end_date_requests),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING id, name, start_date_requests, end_date_requests, status, created_at`,
      [name, start_date_requests, end_date_requests, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Period not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: `Failed to update period: ${error.message}` });
  }
};

/**
 * DELETE /api/enrollment/periods/:id
 * Elimina un período (solo ADMIN)
 * NOTA: No se puede eliminar si tiene solicitudes/asignaciones
 */
const deletePeriod = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete periods' });
  }

  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM enrollment_periods WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Period not found' });
    }

    res.json({ message: 'Period deleted successfully' });
  } catch (error) {
    // Posible error por referencia de clave foránea
    if (error.message.includes('foreign key')) {
      return res.status(400).json({ 
        error: 'Cannot delete period with existing requests or allocations' 
      });
    }
    res.status(500).json({ error: `Failed to delete period: ${error.message}` });
  }
};

module.exports = {
  listEnrollmentPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
};
