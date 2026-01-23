const db = require('../../config/db');
const sessionsService = require('../sessions/service');
const emailService = require('../../common/services/EmailService');
const teachersService = require('../teachers/service');

/**
 * Constantes de fases disponibles
 */
const PHASES = {
  SOLICITUDES: 'SOLICITUDES',
  ASIGNACION: 'ASIGNACION',
  PUBLICACION: 'PUBLICACION',
  EJECUCION: 'EJECUCION'
};

const PHASE_ORDER = [
  PHASES.SOLICITUDES,
  PHASES.ASIGNACION,
  PHASES.PUBLICACION,
  PHASES.EJECUCION
];

/**
 * GET /api/enrollment/periods
 * Lista todos los períodos de matrícula disponibles
 * Filtra por estado si se proporciona query param ?status=ACTIVE
 */
const listEnrollmentPeriods = async (req, res) => {
  const { status } = req.query;

  try {
    let query = `
      SELECT 
        id, name, status, current_phase,
        phase_solicitudes_start, phase_solicitudes_end,
        phase_publicacion_start, phase_publicacion_end,
        phase_ejecucion_start, phase_ejecucion_end,
        created_at, updated_at
      FROM enrollment_periods
    `;
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
      `SELECT 
        id, name, status, current_phase,
        phase_solicitudes_start, phase_solicitudes_end,
        phase_publicacion_start, phase_publicacion_end,
        phase_reclamaciones_start, phase_reclamaciones_end,
        phase_confirmacion_start, phase_confirmacion_end,
        phase_ejecucion_start, phase_ejecucion_end,
        created_at, updated_at
      FROM enrollment_periods WHERE id = $1`,
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
 * GET /api/enrollment/periods/active/current-phase
 * Obtiene la fase actual del período activo
 * Útil para que el frontend sepa qué mostrar/ocultar
 */
const getCurrentPhase = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        id, name, status, current_phase,
        phase_solicitudes_start, phase_solicitudes_end,
        phase_publicacion_start, phase_publicacion_end,
        phase_reclamaciones_start, phase_reclamaciones_end,
        phase_confirmacion_start, phase_confirmacion_end,
        phase_ejecucion_start, phase_ejecucion_end
      FROM enrollment_periods 
      WHERE status = 'ACTIVE' 
      ORDER BY created_at DESC 
      LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({ 
        active: false, 
        message: 'No hay período activo actualmente',
        phase: null 
      });
    }

    const period = result.rows[0];
    const now = new Date();

    // Determinar fase actual basándose en fechas
    let computedPhase = period.current_phase;
    
    // Verificar cada fase según fechas
    if (period.phase_ejecucion_start && now >= new Date(period.phase_ejecucion_start)) {
      computedPhase = PHASES.EJECUCION;
    } else if (period.phase_confirmacion_start && now >= new Date(period.phase_confirmacion_start)) {
      computedPhase = PHASES.CONFIRMACION;
    } else if (period.phase_reclamaciones_start && now >= new Date(period.phase_reclamaciones_start)) {
      computedPhase = PHASES.RECLAMACIONES;
    } else if (period.phase_publicacion_start && now >= new Date(period.phase_publicacion_start)) {
      computedPhase = PHASES.PUBLICACION;
    } else if (period.phase_solicitudes_start && now >= new Date(period.phase_solicitudes_start)) {
      computedPhase = PHASES.SOLICITUDES;
    }

    res.json({
      active: true,
      period_id: period.id,
      period_name: period.name,
      phase: computedPhase,
      phases: {
        solicitudes: {
          start: period.phase_solicitudes_start,
          end: period.phase_solicitudes_end,
          active: computedPhase === PHASES.SOLICITUDES
        },
        publicacion: {
          start: period.phase_publicacion_start,
          end: period.phase_publicacion_end,
          active: computedPhase === PHASES.PUBLICACION
        },
        ejecucion: {
          start: period.phase_ejecucion_start,
          end: period.phase_ejecucion_end,
          active: computedPhase === PHASES.EJECUCION
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to get current phase: ${error.message}` });
  }
};

/**
 * POST /api/enrollment/periods
 * Crea un nuevo período de matrícula (solo ADMIN)
 * Body: { name, phases: { solicitudes: { start, end }, ... } }
 */
const createPeriod = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create periods' });
  }

  const { name, phases } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO enrollment_periods (
        name, status, current_phase,
        phase_solicitudes_start, phase_solicitudes_end,
        phase_publicacion_start, phase_publicacion_end,
        phase_ejecucion_start, phase_ejecucion_end
      )
      VALUES ($1, 'DRAFT', 'SOLICITUDES', $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        name,
        phases?.solicitudes?.start || null,
        phases?.solicitudes?.end || null,
        phases?.publicacion?.start || null,
        phases?.publicacion?.end || null,
        phases?.ejecucion?.start || null,
        phases?.ejecucion?.end || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: `Failed to create period: ${error.message}` });
  }
};

/**
 * PUT /api/enrollment/periods/:id
 * Actualiza un período (solo ADMIN)
 * Permite cambiar: name, status, current_phase, fechas de fases
 */
const updatePeriod = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can update periods' });
  }

  const { id } = req.params;
  const { name, status, current_phase, phases } = req.body;

  try {
    // Construir query dinámicamente
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (current_phase !== undefined) {
      updates.push(`current_phase = $${paramIndex++}`);
      values.push(current_phase);
    }
    if (phases?.solicitudes?.start !== undefined) {
      updates.push(`phase_solicitudes_start = $${paramIndex++}`);
      values.push(phases.solicitudes.start);
    }
    if (phases?.solicitudes?.end !== undefined) {
      updates.push(`phase_solicitudes_end = $${paramIndex++}`);
      values.push(phases.solicitudes.end);
    }
    if (phases?.publicacion?.start !== undefined) {
      updates.push(`phase_publicacion_start = $${paramIndex++}`);
      values.push(phases.publicacion.start);
    }
    if (phases?.publicacion?.end !== undefined) {
      updates.push(`phase_publicacion_end = $${paramIndex++}`);
      values.push(phases.publicacion.end);
    }
    if (phases?.ejecucion?.start !== undefined) {
      updates.push(`phase_ejecucion_start = $${paramIndex++}`);
      values.push(phases.ejecucion.start);
    }
    if (phases?.ejecucion?.end !== undefined) {
      updates.push(`phase_ejecucion_end = $${paramIndex++}`);
      values.push(phases.ejecucion.end);
    }

    // Siempre actualizar updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `
      UPDATE enrollment_periods 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Period not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: `Failed to update period: ${error.message}` });
  }
};

/**
 * PUT /api/enrollment/periods/:id/activate
 * Activa un período (solo ADMIN)
 * Solo puede haber un período activo a la vez
 */
const activatePeriod = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can activate periods' });
  }

  const { id } = req.params;

  try {
    // Desactivar otros períodos activos
    await db.query(
      `UPDATE enrollment_periods SET status = 'CLOSED', updated_at = NOW() WHERE status = 'ACTIVE'`
    );

    // Activar el período seleccionado
    const result = await db.query(
      `UPDATE enrollment_periods 
       SET status = 'ACTIVE', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Period not found' });
    }

    res.json({ 
      message: 'Período activado correctamente',
      period: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to activate period: ${error.message}` });
  }
};

/**
 * PUT /api/enrollment/periods/:id/advance-phase
 * Avanza el período a la siguiente fase (solo ADMIN)
 */
const advancePhase = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can advance phases' });
  }

  const { id } = req.params;
  const { target_phase } = req.body; // Opcional: saltar a una fase específica

  try {
    // Obtener período actual
    const current = await db.query(
      'SELECT id, current_phase, status FROM enrollment_periods WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Period not found' });
    }

    const period = current.rows[0];
    let newPhase;

    if (target_phase) {
      // Validar que la fase objetivo es válida
      if (!PHASE_ORDER.includes(target_phase)) {
        return res.status(400).json({ error: `Invalid phase: ${target_phase}` });
      }
      newPhase = target_phase;
    } else {
      // Avanzar a la siguiente fase
      const currentIndex = PHASE_ORDER.indexOf(period.current_phase);
      if (currentIndex === PHASE_ORDER.length - 1) {
        return res.status(400).json({ error: 'Already at final phase (EJECUCION)' });
      }
      newPhase = PHASE_ORDER[currentIndex + 1];
    }

    // Actualizar fase
    const result = await db.query(
      `UPDATE enrollment_periods 
       SET current_phase = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [newPhase, id]
    );

    // Si avanzamos a PUBLICACION, generar sesiones automáticamente
    let sessionsResult = null;
    if (newPhase === PHASES.PUBLICACION) {
      try {
        sessionsResult = await sessionsService.generateSessionsForPeriod(id);
      } catch (sessionError) {
        console.error('Error generando sesiones:', sessionError.message);
      }
    }

    // Si avanzamos a EJECUCION, crear cuentas para profesores asignados
    let teacherAccountsResult = null;
    if (newPhase === PHASES.EJECUCION) {
      try {
        teacherAccountsResult = await teachersService.createAccountsForAssignedTeachers(id);
        console.log(`👨‍🏫 Cuentas de profesores creadas:`, teacherAccountsResult);
      } catch (teacherError) {
        console.error('Error creando cuentas de profesores:', teacherError.message);
      }
    }

    // Enviar notificación de cambio de fase a coordinadores
    let emailResult = null;
    try {
      emailResult = await emailService.sendPhaseChangeNotification(
        result.rows[0],
        period.current_phase
      );
      console.log(`📧 Emails de cambio de fase enviados:`, emailResult);
    } catch (emailError) {
      console.error('Error enviando emails de cambio de fase:', emailError.message);
    }

    res.json({
      message: `Fase avanzada a ${newPhase}`,
      period: result.rows[0],
      sessions_generated: sessionsResult,
      teacher_accounts: teacherAccountsResult,
      emails_sent: emailResult
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to advance phase: ${error.message}` });
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
    if (error.message.includes('foreign key') || error.message.includes('violates')) {
      return res.status(400).json({ 
        error: 'Cannot delete period with existing requests or allocations' 
      });
    }
    res.status(500).json({ error: `Failed to delete period: ${error.message}` });
  }
};

/**
 * PUT /api/enrollment/periods/:id/publish (DEPRECATED - usar advance-phase)
 * Mantener por compatibilidad
 */
const publishPeriod = async (req, res) => {
  req.body.target_phase = PHASES.PUBLICACION;
  return advancePhase(req, res);
};

module.exports = {
  listEnrollmentPeriods,
  getPeriodById,
  getCurrentPhase,
  createPeriod,
  updatePeriod,
  activatePeriod,
  advancePhase,
  deletePeriod,
  publishPeriod,
  PHASES,
  PHASE_ORDER
};
