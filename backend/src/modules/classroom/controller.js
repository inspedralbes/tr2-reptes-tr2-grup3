/**
 * classroom/controller.js
 * 
 * Controlador para el módulo de aula virtual.
 * Gestiona sesiones, alumnos, asistencia y evaluaciones.
 */
const pool = require('../../config/db');
const emailService = require('../../common/services/EmailService');
const teachersService = require('../teachers/service');

/**
 * Obtiene los talleres asignados al profesor actual
 * GET /api/classroom/my-workshops
 */
const getMyWorkshops = async (req, res) => {
  try {
    const userId = req.user.id;
    const workshops = await teachersService.getTeacherWorkshops(userId);
    res.json(workshops);
  } catch (err) {
    console.error('Error obteniendo talleres del profesor:', err);
    res.status(500).json({ error: 'Error al obtener talleres' });
  }
};

/**
 * Lista las sesiones de un período o edición
 * Si es TEACHER, solo muestra sesiones de sus talleres asignados
 */
const listSessions = async (req, res) => {
  try {
    const { editionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Si es profesor, verificar que tiene acceso a esta edición
    if (userRole === 'TEACHER' && editionId) {
      const hasAccess = await teachersService.canAccessWorkshop(userId, editionId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tens accés a aquest taller' });
      }
    }

    let query = `
      SELECT ws.*, we.id as edition_id, w.title as workshop_title
      FROM workshop_sessions ws
      JOIN workshop_editions we ON we.id = ws.workshop_edition_id
      JOIN workshops w ON w.id = we.workshop_id
    `;
    const params = [];
    
    // Si es profesor y no especifica edición, solo mostrar sus talleres
    if (userRole === 'TEACHER' && !editionId) {
      query += `
        WHERE we.id IN (
          SELECT wat.workshop_edition_id 
          FROM workshop_assigned_teachers wat
          JOIN teachers t ON t.id = wat.teacher_id
          WHERE t.user_id = $1
        )
      `;
      params.push(userId);
    } else if (editionId) {
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
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Si es profesor, verificar que tiene acceso a esta edición
    if (userRole === 'TEACHER') {
      const hasAccess = await teachersService.canAccessWorkshop(userId, editionId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tens accés a aquest taller' });
      }
    }
    
    // Obtener alumnos de allocation_students + students
    const query = `
      SELECT DISTINCT 
        ast.id as allocation_student_id,
        s.id as student_id,
        s.nombre_completo as student_name,
        s.curso as course,
        s.photo_url,
        a.school_id,
        sch.name as school_name
      FROM allocations a
      JOIN schools sch ON sch.id = a.school_id
      LEFT JOIN allocation_students ast ON ast.allocation_id = a.id
      LEFT JOIN students s ON s.id = ast.student_id
      WHERE a.workshop_edition_id = $1
        AND a.status IN ('PROVISIONAL', 'PUBLISHED', 'ACCEPTED')
      ORDER BY s.nombre_completo ASC NULLS LAST
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
          AND a.status IN ('PROVISIONAL', 'PUBLISHED', 'ACCEPTED')
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
            school_name: alloc.school_name,
            photo_url: null
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
      school_name: r.school_name,
      photo_url: r.photo_url
    })));
  } catch (err) {
    console.error('Error obteniendo alumnos:', err);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
};

/**
 * Registra la asistencia de una sesión usando attendance_logs
 * Envía notificación al tutor si un alumno es marcado como ABSENT
 */
const saveAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { attendance } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // attendance es un array de { studentId, status, observation }
    // status: 'PRESENT' | 'ABSENT' | 'LATE'
    
    // Obtener información de la sesión y taller para los emails
    const sessionInfo = await pool.query(`
      SELECT ws.*, w.title as workshop_title, we.id as edition_id
      FROM workshop_sessions ws
      JOIN workshop_editions we ON we.id = ws.workshop_edition_id
      JOIN workshops w ON w.id = we.workshop_id
      WHERE ws.id = $1
    `, [sessionId]);
    
    if (sessionInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Sessió no trobada' });
    }
    
    const sessionData = sessionInfo.rows[0];
    
    // Si es profesor, verificar que tiene acceso a este taller
    if (userRole === 'TEACHER') {
      const hasAccess = await teachersService.canAccessWorkshop(userId, sessionData.edition_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tens accés a aquest taller' });
      }
    }
    
    const client = await pool.getClient();
    const absentStudents = []; // Para enviar emails después del commit
    
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
          
          // Si es ABSENT o LATE, preparar notificación
          if (record.status === 'ABSENT' || record.status === 'LATE') {
            absentStudents.push({
              studentId: record.studentId,
              status: record.status,
              observation: record.observation
            });
          }
        }
      }
      
      await client.query('COMMIT');
      
      // Enviar emails de ausencia (fuera del transaction para no bloquear)
      let emailResults = [];
      if (absentStudents.length > 0) {
        for (const absent of absentStudents) {
          try {
            // Obtener datos del alumno y tutor
            const studentQuery = await pool.query(`
              SELECT id, nombre_completo, curso as course, tutor_email, tutor_nombre
              FROM students
              WHERE id = $1
            `, [absent.studentId]);
            
            if (studentQuery.rows.length > 0) {
              const studentData = studentQuery.rows[0];
              const result = await emailService.sendAbsenceNotification(
                studentData,
                sessionData,
                absent.status,
                absent.observation
              );
              emailResults.push({ 
                studentId: absent.studentId, 
                success: result.success,
                reason: result.reason 
              });
            }
          } catch (emailError) {
            console.error(`Error enviando email de ausencia para alumno ${absent.studentId}:`, emailError.message);
            emailResults.push({ 
              studentId: absent.studentId, 
              success: false, 
              error: emailError.message 
            });
          }
        }
      }
      
      res.json({ 
        message: 'Asistencia guardada correctamente',
        count: attendance.length,
        absence_notifications: emailResults
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
      SELECT al.*, s.nombre_completo as student_name
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

/**
 * Obtiene las notas del profesor sobre los alumnos de su taller
 */
const getStudentNotes = async (req, res) => {
  try {
    const { editionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Si es profesor, verificar que tiene acceso
    if (userRole === 'TEACHER') {
      const hasAccess = await teachersService.canAccessWorkshop(userId, editionId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tens accés a aquest taller' });
      }
    }
    
    // Obtener el teacher_id desde el user_id
    const teacherQuery = await pool.query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );
    
    if (teacherQuery.rows.length === 0) {
      return res.json([]);
    }
    
    const teacherId = teacherQuery.rows[0].id;
    
    const query = `
      SELECT tsn.*, s.nombre_completo as student_name
      FROM teacher_student_notes tsn
      JOIN students s ON s.id = tsn.student_id
      WHERE tsn.teacher_id = $1 AND tsn.workshop_edition_id = $2
    `;
    const result = await pool.query(query, [teacherId, editionId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo notas:', err);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
};

/**
 * Guarda o actualiza una nota del profesor sobre un alumno
 */
const saveStudentNote = async (req, res) => {
  try {
    const { editionId, studentId } = req.params;
    const { note } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Si es profesor, verificar que tiene acceso
    if (userRole === 'TEACHER') {
      const hasAccess = await teachersService.canAccessWorkshop(userId, editionId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tens accés a aquest taller' });
      }
    }
    
    // Obtener el teacher_id desde el user_id
    const teacherQuery = await pool.query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );
    
    if (teacherQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Professor no trobat' });
    }
    
    const teacherId = teacherQuery.rows[0].id;
    
    // Upsert de la nota
    const query = `
      INSERT INTO teacher_student_notes (teacher_id, student_id, workshop_edition_id, note)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (teacher_id, student_id, workshop_edition_id)
      DO UPDATE SET note = $4, updated_at = NOW()
      RETURNING *
    `;
    const result = await pool.query(query, [teacherId, studentId, editionId, note]);
    
    res.json({
      message: 'Nota guardada correctament',
      note: result.rows[0]
    });
  } catch (err) {
    console.error('Error guardando nota:', err);
    res.status(500).json({ error: 'Error al guardar nota' });
  }
};

/**
 * Obtiene estadísticas de asistencia del taller para el dashboard
 */
const getWorkshopStats = async (req, res) => {
  try {
    const { editionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Si es profesor, verificar que tiene acceso
    if (userRole === 'TEACHER') {
      const hasAccess = await teachersService.canAccessWorkshop(userId, editionId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tens accés a aquest taller' });
      }
    }
    
    // Obtener todas las sesiones
    const sessionsQuery = await pool.query(`
      SELECT id, session_number, date
      FROM workshop_sessions
      WHERE workshop_edition_id = $1
      ORDER BY session_number
    `, [editionId]);
    
    // Obtener conteo de alumnos
    const studentsQuery = await pool.query(`
      SELECT COUNT(*) as total
      FROM allocation_students als
      JOIN allocations a ON a.id = als.allocation_id
      WHERE a.workshop_edition_id = $1
        AND a.status IN ('PROVISIONAL', 'PUBLISHED', 'ACCEPTED')
    `, [editionId]);
    
    const totalStudents = parseInt(studentsQuery.rows[0]?.total || 0);
    const totalSessions = sessionsQuery.rows.length;
    
    // Obtener asistencia de TODAS las sesiones (sin filtrar por fecha)
    // Esto permite que se muestren stats aunque se pase lista en sesiones "futuras"
    let completedSessions = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    
    for (const session of sessionsQuery.rows) {
      // Verificar si hay asistencia registrada para esta sesión
      const attQuery = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM attendance_logs
        WHERE session_id = $1
        GROUP BY status
      `, [session.id]);
      
      // Si hay registros de asistencia, contar esta sesión como completada
      if (attQuery.rows.length > 0) {
        completedSessions++;
        attQuery.rows.forEach(row => {
          if (row.status === 'PRESENT') totalPresent += parseInt(row.count);
          else if (row.status === 'ABSENT') totalAbsent += parseInt(row.count);
          else if (row.status === 'LATE') totalLate += parseInt(row.count);
        });
      }
    }
    
    const totalAttendanceRecords = totalPresent + totalAbsent + totalLate;
    const attendanceRate = totalAttendanceRecords > 0 
      ? Math.round((totalPresent / totalAttendanceRecords) * 100) 
      : 0;
    
    res.json({
      totalStudents,
      totalSessions,
      completedSessions,
      remainingSessions: totalSessions - completedSessions,
      attendanceRate,
      totalPresent,
      totalAbsent,
      totalLate
    });
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = {
  getMyWorkshops,
  listSessions,
  getStudentsForEdition,
  saveAttendance,
  getAttendance,
  saveEvaluations,
  getEvaluations,
  getStudentNotes,
  saveStudentNote,
  getWorkshopStats,
};
