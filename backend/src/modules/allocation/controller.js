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
    // Verificar que el período existe y está en fase ASIGNACION
    const periodResult = await db.query(
      "SELECT id, status, current_phase FROM enrollment_periods WHERE id = $1",
      [period_id]
    );

    if (periodResult.rows.length === 0) {
      return res.status(404).json({ error: "Period not found" });
    }

    const period = periodResult.rows[0];
    if (period.status !== "ACTIVE") {
      return res.status(400).json({
        error: "Period must be in ACTIVE status to run allocation",
      });
    }
    
    if (period.current_phase !== "ASIGNACION") {
      return res.status(400).json({
        error: "Period must be in ASIGNACION phase to run allocation. Current phase: " + period.current_phase,
      });
    }

    // Verificar si ya hay asignaciones para este período (protección contra re-ejecución)
    const existingAllocations = await db.query(
      `SELECT COUNT(*) as count FROM allocations a
       JOIN workshop_editions we ON a.workshop_edition_id = we.id
       WHERE we.enrollment_period_id = $1 AND a.status IN ('PROVISIONAL', 'PUBLISHED', 'ACCEPTED')`,
      [period_id]
    );

    if (parseInt(existingAllocations.rows[0].count) > 0) {
      const force = req.body.force === true;
      if (!force) {
        return res.status(409).json({
          error: "Ya existen asignaciones para este período. Use force=true para eliminar las existentes y re-ejecutar.",
          existing_count: parseInt(existingAllocations.rows[0].count)
        });
      }
      
      // Si force=true, eliminar asignaciones existentes
      await db.query(
        `DELETE FROM allocations WHERE workshop_edition_id IN (
           SELECT id FROM workshop_editions WHERE enrollment_period_id = $1
         )`,
        [period_id]
      );
      console.log(`⚠️ Force mode: Eliminadas ${existingAllocations.rows[0].count} asignaciones previas`);
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
 * Lista las asignaciones realizadas con profesores asignados
 * Filtros opcionales: period_id, school_id, status
 */
const listAllocations = async (req, res) => {
  const { period_id, school_id, status } = req.query;

  try {
    let query = `
      SELECT a.id, a.workshop_edition_id, a.school_id, a.assigned_seats, a.status,
             s.name as school_name,
             s.code as school_code,
             w.title as workshop_title,
             we.day_of_week, we.start_time, we.end_time,
             we.enrollment_period_id,
             (
               SELECT json_agg(json_build_object(
                 'id', t.id,
                 'name', t.full_name,
                 'email', t.email,
                 'school_id', t.school_id,
                 'school_name', ts.name
               ))
               FROM workshop_assigned_teachers wat
               JOIN teachers t ON wat.teacher_id = t.id
               JOIN schools ts ON t.school_id = ts.id
               WHERE wat.workshop_edition_id = a.workshop_edition_id
                 AND t.school_id = a.school_id
             ) as assigned_teachers,
             (
               SELECT json_agg(json_build_object(
                 'id', t.id,
                 'name', t.full_name,
                 'school_id', t.school_id,
                 'school_name', ts.name
               ))
               FROM workshop_assigned_teachers wat
               JOIN teachers t ON wat.teacher_id = t.id
               JOIN schools ts ON t.school_id = ts.id
               WHERE wat.workshop_edition_id = a.workshop_edition_id
             ) as all_workshop_teachers
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
 * GET /api/allocations/:id
 * Obtener detalles de una asignación específica
 */
const getAllocationById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT a.id, a.workshop_edition_id, a.school_id, a.assigned_seats, a.status,
             s.name as school_name,
             w.title as workshop_title,
             we.day_of_week, we.start_time, we.end_time
      FROM allocations a
      JOIN schools s ON a.school_id = s.id
      JOIN workshop_editions we ON a.workshop_edition_id = we.id
      JOIN workshops w ON we.workshop_id = w.id
      WHERE a.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    res.json(result.rows[0]);
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

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // Actualizar estado de asignación a ACCEPTED
    const allocResult = await client.query(
      `UPDATE allocations SET status = 'ACCEPTED' WHERE id = $1 RETURNING id, assigned_seats, school_id`,
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

    const allocation_id = id;

    for (const student of students) {
      // 1. Check if student already exists (by idalu or name+school)
      // Since we might get limited info, if we have IDALU use it.
      let student_id = null;

      // Check by IDALU if provided
      if (student.idalu) {
        const existIdalu = await client.query(
          "SELECT id FROM students WHERE idalu = $1 AND school_id = $2",
          [student.idalu, assignment.school_id]
        );
        if (existIdalu.rows.length > 0) student_id = existIdalu.rows[0].id;
      }

      // Fallback check by name if no IDALU or not found
      if (!student_id && student.name) {
        const existName = await client.query(
          "SELECT id FROM students WHERE nombre_completo = $1 AND school_id = $2",
          [student.name, assignment.school_id]
        );
        if (existName.rows.length > 0) student_id = existName.rows[0].id;
      }

      // Create if not exists
      if (!student_id) {
        const studentResult = await client.query(
          `INSERT INTO students (nombre_completo, id_alu, school_id)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [student.name, student.idalu || null, assignment.school_id]
        );
        student_id = studentResult.rows[0].id;
      }

      // 2. Link to allocation if not already linked
      const linkCheck = await client.query(
        "SELECT id FROM allocation_students WHERE allocation_id = $1 AND student_id = $2",
        [allocation_id, student_id]
      );

      if (linkCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO allocation_students (allocation_id, student_id, status)
           VALUES ($1, $2, 'ACTIVE')`,
          [allocation_id, student_id]
        );
      }
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

/**
 * POST /api/allocations/:id/students
   * Vincular un alumno existente a una asignación
   * Body: { student_id: UUID }
   */
const addStudentToAllocation = async (req, res) => {
  if (req.user.role !== "CENTER_COORD") {
    return res.status(403).json({
      error: "Only centers can manage allocations",
    });
  }

  const { id } = req.params;
  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: "student_id is required" });
  }

  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // 1. Verificar asignación y permisos
    const allocCallback = await client.query(
      `SELECT id, school_id, assigned_seats, status 
       FROM allocations WHERE id = $1`,
      [id]
    );

    if (allocCallback.rows.length === 0) {
      throw new Error("Allocation not found");
    }

    const allocation = allocCallback.rows[0];

    // Verificar que pertenece a la escuela del coordinador
    // (Necesitamos verificar que req.user.id sea el coordinador de allocation.school_id)
    const schoolCheck = await client.query(
      "SELECT id FROM schools WHERE coordinator_user_id = $1 AND id = $2",
      [req.user.id, allocation.school_id]
    );

    if (schoolCheck.rows.length === 0) {
      throw new Error("You are not authorized to manage this allocation");
    }

    // 2. Verificar cupo
    const countCheck = await client.query(
      "SELECT COUNT(*) as count FROM allocation_students WHERE allocation_id = $1 AND status = 'ACTIVE'",
      [id]
    );

    if (parseInt(countCheck.rows[0].count) >= allocation.assigned_seats) {
      throw new Error("No seats available in this allocation");
    }

    // 3. Vincular estudiante
    // Verificar si ya está vinculado
    const existingLink = await client.query(
      "SELECT id FROM allocation_students WHERE allocation_id = $1 AND student_id = $2",
      [id, student_id]
    );

    if (existingLink.rows.length > 0) {
      throw new Error("Student is already assigned to this allocation");
    }

    await client.query(
      `INSERT INTO allocation_students (allocation_id, student_id, status)
       VALUES ($1, $2, 'ACTIVE')`,
      [id, student_id]
    );

    await client.query("COMMIT");

    res.status(201).json({ message: "Student assigned successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/allocations/:id
 * ADMIN puede editar una asignación (cambiar plazas asignadas)
 * Body: { assigned_seats: number }
 */
const updateAllocation = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Only admins can edit allocations",
    });
  }

  const { id } = req.params;
  const { assigned_seats } = req.body;

  if (!assigned_seats || assigned_seats < 1 || assigned_seats > 4) {
    return res.status(400).json({ 
      error: "assigned_seats must be between 1 and 4" 
    });
  }

  try {
    const result = await db.query(
      `UPDATE allocations 
       SET assigned_seats = $1
       WHERE id = $2
       RETURNING *`,
      [assigned_seats, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    res.json({
      success: true,
      message: "Allocation updated",
      allocation: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/allocations/publish-all
 * ADMIN publica todas las asignaciones PROVISIONALES → PUBLISHED
 * Body: { period_id: UUID }
 */
const publishAllAllocations = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Only admins can publish allocations",
    });
  }

  const { period_id } = req.body;

  if (!period_id) {
    return res.status(400).json({ error: "period_id is required" });
  }

  try {
    const result = await db.query(
      `UPDATE allocations a
       SET status = 'PUBLISHED'
       FROM workshop_editions we
       WHERE a.workshop_edition_id = we.id
         AND we.enrollment_period_id = $1
         AND a.status = 'PROVISIONAL'
       RETURNING a.id`,
      [period_id]
    );

    res.json({
      success: true,
      message: `${result.rowCount} allocations published`,
      published_count: result.rowCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  runAllocation,
  getDemandSummaryController,
  listAllocations,
  confirmAllocation,
  addStudentToAllocation,
  getAllocationById,
  updateAllocation,
  publishAllAllocations,
};
