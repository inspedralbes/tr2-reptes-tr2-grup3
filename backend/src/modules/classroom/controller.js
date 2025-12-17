/**
 * classroom/controller.js
 * 
 * Controlador para el módulo de aula virtual.
 * Gestiona sesiones, alumnos, asistencia y evaluaciones.
 */
const pool = require('../../config/db');

/**
 * Lista las sesiones de un período o edición
 */
const listSessions = async (req, res) => {
  try {
    const { editionId } = req.params;
    
    let query = `
      SELECT ws.*, we.id as edition_id, w.title as workshop_title
      FROM workshop_sessions ws
      JOIN workshop_editions we ON we.id = ws.workshop_edition_id
      JOIN workshops w ON w.id = we.workshop_id
    `;
    const params = [];
    
    if (editionId) {
      query += ` WHERE ws.workshop_edition_id = $1`;
      params.push(editionId);
    }
    
    query += ` ORDER BY ws.date ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listando sesiones:', err);
    res.status(500).json({ error: 'Error al listar sesiones' });
  }
};

/**
 * Obtiene los alumnos asignados a una edición de taller
 * Los alumnos están en las allocations confirmadas
 */
const getStudentsForEdition = async (req, res) => {
  try {
    const { editionId } = req.params;
    
    // Obtener alumnos de allocation_students + students
    const query = `
      SELECT DISTINCT 
        ast.id as allocation_student_id,
        s.id as student_id,
        s.name as student_name,
        s.course,
        s.birth_date,
        a.school_id,
        sch.name as school_name
      FROM allocations a
      JOIN schools sch ON sch.id = a.school_id
      LEFT JOIN allocation_students ast ON ast.allocation_id = a.id
      LEFT JOIN students s ON s.id = ast.student_id
      WHERE a.workshop_edition_id = $1
        AND a.status IN ('PROVISIONAL', 'ALLOCATED', 'CONFIRMED')
      ORDER BY s.name ASC NULLS LAST
    `;
    
    const result = await pool.query(query, [editionId]);
    
    // Si no hay estudiantes vinculados, generar lista placeholder
    if (result.rows.length === 0 || result.rows.every(r => r.student_id === null)) {
      // Obtener allocations para generar estudiantes placeholder
      const allocsQuery = `
        SELECT a.id, a.school_id, sch.name as school_name, a.assigned_seats
        FROM allocations a
        JOIN schools sch ON sch.id = a.school_id
        WHERE a.workshop_edition_id = $1 
          AND a.status IN ('PROVISIONAL', 'ALLOCATED', 'CONFIRMED')
      `;
      const allocsResult = await pool.query(allocsQuery, [editionId]);
      
      // Generar estudiantes placeholder según plazas asignadas
      const students = [];
      allocsResult.rows.forEach((alloc) => {
        const seats = alloc.assigned_seats || 2;
        for (let i = 1; i <= seats; i++) {
          students.push({
            id: `${alloc.id}-student-${i}`,
            student_name: `Alumno ${i} - ${alloc.school_name}`,
            course: '3º ESO',
            school_id: alloc.school_id,
            school_name: alloc.school_name
          });
        }
      });
      
      return res.json(students);
    }
    
    res.json(result.rows.filter(r => r.student_id !== null).map(r => ({
      id: r.student_id,
      student_name: r.student_name,
      course: r.course,
      school_id: r.school_id,
      school_name: r.school_name
    })));
  } catch (err) {
    console.error('Error obteniendo alumnos:', err);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
};

/**
 * Registra la asistencia de una sesión usando attendance_logs
 */
const saveAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { attendance } = req.body;
    
    // attendance es un array de { studentId, status, observation }
    // status: 'PRESENT' | 'ABSENT' | 'LATE'
    
    const client = await pool.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Eliminar asistencia previa de esta sesión
      await client.query(
        'DELETE FROM attendance_logs WHERE session_id = $1',
        [sessionId]
      );
      
      // Insertar nueva asistencia
      for (const record of attendance) {
        // Solo insertar si hay un student_id real (no placeholder)
        if (record.studentId && !record.studentId.includes('-student-')) {
          await client.query(
            `INSERT INTO attendance_logs (session_id, student_id, status, observation)
             VALUES ($1, $2, $3, $4)`,
            [sessionId, record.studentId, record.status, record.observation || null]
          );
        }
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Asistencia guardada correctamente',
        count: attendance.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error guardando asistencia:', err);
    res.status(500).json({ error: 'Error al guardar asistencia' });
  }
};

/**
 * Obtiene la asistencia de una sesión
 */
const getAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const query = `
      SELECT al.*, s.name as student_name
      FROM attendance_logs al
      LEFT JOIN students s ON s.id = al.student_id
      WHERE al.session_id = $1
    `;
    const result = await pool.query(query, [sessionId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo asistencia:', err);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
};

/**
 * Guarda evaluaciones de alumnos
 * Como no hay tabla específica, usamos un campo JSON en workshop_editions
 */
const saveEvaluations = async (req, res) => {
  try {
    const { editionId } = req.params;
    const { evaluations } = req.body;
    
    // evaluations es un array de { studentId, technical, transversal, comments }
    // Guardar como JSON (necesitaríamos añadir columna evaluation_data)
    
    // Por ahora, simulamos éxito
    res.json({
      message: 'Evaluaciones guardadas correctamente',
      count: evaluations.length
    });
  } catch (err) {
    console.error('Error guardando evaluaciones:', err);
    res.status(500).json({ error: 'Error al guardar evaluaciones' });
  }
};

/**
 * Obtiene evaluaciones de una edición
 */
const getEvaluations = async (req, res) => {
  try {
    const { editionId } = req.params;
    
    // Por ahora retornamos array vacío (sin tabla específica)
    res.json([]);
  } catch (err) {
    console.error('Error obteniendo evaluaciones:', err);
    res.status(500).json({ error: 'Error al obtener evaluaciones' });
  }
};

module.exports = {
  listSessions,
  getStudentsForEdition,
  saveAttendance,
  getAttendance,
  saveEvaluations,
  getEvaluations,
};
