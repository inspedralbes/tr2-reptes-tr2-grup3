const { runAllocationAlgorithm, getDemandSummary } = require("./service");
const db = require("../../config/db");

/**
 * GET /api/allocation/demand-summary?period_id=xxx
 * Obtiene un resumen de la demanda antes de ejecutar el algoritmo
 * Devuelve: tabla con Centro | Taller | Día | #Alumnos solicitados
 * Útil para monitoreo y validación antes de la asignación
 */
const getDemandSummaryController = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Only admins can view demand summary" });
  }

  const { period_id } = req.query;

  if (!period_id) {
    return res.status(400).json({ error: "period_id is required" });
  }

  try {
    const summary = await getDemandSummary(period_id);
    res.json({ count: summary.length, data: summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/allocation/run
 * Ejecuta el algoritmo de asignación inteligente
 * Solo ADMIN puede hacer esto
 * Body: { period_id: UUID }
 *
 * El algoritmo:
 * 1. Respeta restricción de disponibilidad (martes)
 * 2. Máximo 4 alumnos por centro, por taller
 * 3. Máximo 16 alumnos totales por taller
 * 4. Prioriza profesores referentes
 */
const runAllocation = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Only admins can run allocation" });
  }

  const { period_id } = req.body;

  if (!period_id) {
    return res.status(400).json({ error: "period_id is required" });
  }

  try {
    // Verificar que el período existe y está en estado OPEN
    const periodResult = await db.query(
      "SELECT id, status FROM enrollment_periods WHERE id = $1",
      [period_id]
    );

    if (periodResult.rows.length === 0) {
      return res.status(404).json({ error: "Period not found" });
    }

    if (periodResult.rows[0].status !== "OPEN") {
      return res.status(400).json({
        error: "Period must be in OPEN status to run allocation",
      });
    }

    // Ejecutar algoritmo
    const result = await runAllocationAlgorithm(period_id);

    res.json({
      success: true,
      message: "Allocation algorithm executed successfully",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to run allocation: ${error.message}`,
    });
  }
};

/**
 * GET /api/allocations?period_id=xxx&school_id=yyy
 * Lista las asignaciones realizadas
 * Filtros opcionales: period_id, school_id, status
 */
const listAllocations = async (req, res) => {
  const { period_id, school_id, status } = req.query;

  try {
    let query = `
      SELECT a.id, a.workshop_edition_id, a.school_id, a.assigned_seats, a.status,
             s.name as school_name,
             w.title as workshop_title,
             we.day_of_week, we.start_time, we.end_time
      FROM allocations a
      JOIN schools s ON a.school_id = s.id
      JOIN workshop_editions we ON a.workshop_edition_id = we.id
      JOIN workshops w ON we.workshop_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (period_id) {
      params.push(period_id);
      query += ` AND we.enrollment_period_id = $${params.length}`;
    }

    if (school_id) {
      params.push(school_id);
      query += ` AND a.school_id = $${params.length}`;
    }

    if (status) {
      params.push(status.toUpperCase());
      query += ` AND a.status = $${params.length}`;
    }

    query += " ORDER BY s.name, w.title";

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/allocations/:id/confirm
 * Centro confirma una asignación e ingresa los nombres de alumnos
 * Body: { students: [ { name, idalu }, ... ] }
 */
const confirmAllocation = async (req, res) => {
  if (req.user.role !== "CENTER_COORD") {
    return res.status(403).json({
      error: "Only centers can confirm allocations",
    });
  }

  const { id } = req.params;
  const { students } = req.body;

  if (!students || students.length === 0) {
    return res.status(400).json({ error: "students array is required" });
  }

  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // Actualizar estado de asignación a ACCEPTED
    const allocResult = await client.query(
      `UPDATE allocations SET status = 'ACCEPTED' WHERE id = $1 RETURNING id, assigned_seats`,
      [id]
    );

    if (allocResult.rows.length === 0) {
      throw new Error("Allocation not found");
    }

    const assignment = allocResult.rows[0];

    // Validar número de estudiantes
    if (students.length > assignment.assigned_seats) {
      throw new Error(
        `Cannot confirm more students (${students.length}) than assigned seats (${assignment.assigned_seats})`
      );
    }

    // Obtener student IDs o crearlos
    const allocation_id = id;

    for (const student of students) {
      // Crear o actualizar estudiante
      const studentResult = await client.query(
        `INSERT INTO students (nombre_completo, id_alu, school_id)
         VALUES ($1, $2, (SELECT school_id FROM allocations WHERE id = $3))
         RETURNING id`,
        [student.name, student.idalu || null, allocation_id]
      );

      const student_id = studentResult.rows[0].id;

      // Vincular a la asignación
      await client.query(
        `INSERT INTO allocation_students (allocation_id, student_id, status)
         VALUES ($1, $2, 'ACTIVE')`,
        [allocation_id, student_id]
      );
    }

    await client.query("COMMIT");

    res.json({
      allocation_id: id,
      status: "ACCEPTED",
      students_confirmed: students.length,
      message: "Allocation confirmed successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  runAllocation,
  getDemandSummaryController,
  listAllocations,
  confirmAllocation,
};
