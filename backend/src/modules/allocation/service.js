const db = require('../../config/db');

/**
 * ALGORITMO DE ASIGNACIÓN INTELIGENTE
 * 
 * Modalidad C - Restricciones:
 * 1. Máximo 4 alumnos por centro, por taller
 * 2. Total 16 alumnos por taller
 * 3. No asignar martes a centros que no pueden
 * 4. Priorizar profesores referentes
 */

const runAllocationAlgorithm = async (periodId) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Obtener todas las solicitudes para este período
    const requests = await client.query(
      `SELECT r.id, r.school_id, r.available_for_tuesdays,
              ri.workshop_edition_id, ri.requested_students, ri.priority,
              rtp.workshop_edition_id as pref_workshop_id
       FROM requests r
       LEFT JOIN request_items ri ON r.id = ri.request_id
       LEFT JOIN request_teacher_preferences rtp ON r.id = rtp.request_id
       WHERE r.enrollment_period_id = $1 AND r.status = 'SUBMITTED'
       ORDER BY r.id, ri.priority`,
      [periodId]
    );

    if (requests.rows.length === 0) {
      return { message: 'No requests to allocate' };
    }

    // 2. Obtener información de ediciones
    const editions = await client.query(
      `SELECT we.id, we.workshop_id, we.day_of_week, we.capacity_total, we.max_per_school,
              w.title
       FROM workshop_editions we
       JOIN workshops w ON we.workshop_id = w.id
       WHERE we.enrollment_period_id = $1`,
      [periodId]
    );

    // 3. Crear estructura de seguimiento
    const editionCapacity = {};
    const editionPerSchool = {};

    for (const edition of editions.rows) {
      editionCapacity[edition.id] = {
        total: edition.capacity_total,
        current: 0,
        edition: edition,
      };
      editionPerSchool[edition.id] = {};
    }

    // 4. Procesar solicitudes respetando restricciones
    const allocations = [];

    for (const req of requests.rows) {
      if (!req.workshop_edition_id) continue;

      const edition_id = req.workshop_edition_id;
      const school_id = req.school_id;
      const requested = req.requested_students;

      // Restricción 1: No asignar martes si el centro no puede
      if (
        !req.available_for_tuesdays &&
        editionCapacity[edition_id].edition.day_of_week === 'TUESDAY'
      ) {
        console.log(
          `Skipping ${school_id} for Tuesday workshop ${edition_id}`
        );
        continue;
      }

      // Restricción 2: No exceder 4 por centro
      const currentForSchool = editionPerSchool[edition_id][school_id] || 0;
      const canAssign = Math.min(
        requested,
        editionCapacity[edition_id].edition.max_per_school - currentForSchool,
        editionCapacity[edition_id].total - editionCapacity[edition_id].current
      );

      if (canAssign > 0) {
        allocations.push({
          workshop_edition_id: edition_id,
          school_id,
          assigned_seats: canAssign,
          status: 'PROVISIONAL',
        });

        // Actualizar contadores
        editionCapacity[edition_id].current += canAssign;
        editionPerSchool[edition_id][school_id] = currentForSchool + canAssign;
      }
    }

    // 5. Insertar asignaciones en BD
    for (const alloc of allocations) {
      await client.query(
        `INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status)
         VALUES ($1, $2, $3, $4)`,
        [alloc.workshop_edition_id, alloc.school_id, alloc.assigned_seats, alloc.status]
      );
    }

    // 6. Cambiar estado del período a PROCESSING
    await client.query(
      `UPDATE enrollment_periods SET status = 'PROCESSING' WHERE id = $1`,
      [periodId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      allocations_created: allocations.length,
      total_students_allocated: allocations.reduce((sum, a) => sum + a.assigned_seats, 0),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Obtiene el resumen de demanda para un período
 * (usado para monitoreo antes de ejecutar algoritmo)
 */
const getDemandSummary = async (periodId) => {
  try {
    const result = await db.query(
      `SELECT
        s.code as school_code,
        s.name as school_name,
        w.title as workshop_title,
        we.day_of_week,
        SUM(ri.requested_students) as total_requested,
        COUNT(DISTINCT ri.id) as item_count,
        MAX(ri.priority) as max_priority
       FROM requests r
       JOIN schools s ON r.school_id = s.id
       JOIN request_items ri ON ri.request_id = r.id
       JOIN workshop_editions we ON ri.workshop_edition_id = we.id
       JOIN workshops w ON we.workshop_id = w.id
       WHERE r.enrollment_period_id = $1
       GROUP BY s.code, s.name, w.title, we.day_of_week
       ORDER BY s.name, w.title`,
      [periodId]
    );

    return result.rows;
  } catch (error) {
    throw new Error(`Failed to fetch demand summary: ${error.message}`);
  }
};

module.exports = {
  runAllocationAlgorithm,
  getDemandSummary,
};
