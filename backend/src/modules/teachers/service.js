/**
 * teachers/service.js
 * 
 * Servicio para gestión de profesores.
 * Incluye la creación automática de cuentas de usuario para profesores asignados.
 */
const db = require('../../config/db');
const bcrypt = require('bcrypt');
const emailService = require('../../common/services/EmailService');

/**
 * Genera una contraseña aleatoria segura
 */
const generatePassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
};

/**
 * Crea cuenta de usuario para un profesor si no la tiene
 * @param {Object} teacher - Datos del profesor (id, full_name, email, user_id)
 * @returns {Object} Resultado { created, userId, password?, error? }
 */
const createTeacherAccount = async (teacher) => {
  if (!teacher.email) {
    return { created: false, reason: 'no_email' };
  }

  // Si ya tiene user_id, la cuenta ya existe
  if (teacher.user_id) {
    return { created: false, reason: 'already_exists', userId: teacher.user_id };
  }

  try {
    // Verificar que el email no esté ya en uso
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [teacher.email]
    );

    if (existingUser.rows.length > 0) {
      // El email ya existe como usuario, vincular al profesor
      const existingUserId = existingUser.rows[0].id;
      await db.query(
        'UPDATE teachers SET user_id = $1 WHERE id = $2',
        [existingUserId, teacher.id]
      );
      return { created: false, reason: 'linked_existing', userId: existingUserId };
    }

    // Generar password y hash
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, 'TEACHER') RETURNING id`,
      [teacher.full_name, teacher.email, hashedPassword]
    );
    const userId = newUser.rows[0].id;

    // Vincular al profesor
    await db.query(
      'UPDATE teachers SET user_id = $1 WHERE id = $2',
      [userId, teacher.id]
    );

    return { 
      created: true, 
      userId, 
      password, 
      email: teacher.email,
      name: teacher.full_name 
    };
  } catch (error) {
    console.error(`Error creando cuenta para profesor ${teacher.full_name}:`, error.message);
    return { created: false, error: error.message };
  }
};

/**
 * Crea cuentas para TODOS los profesores asignados a talleres de un período
 * Se llama automáticamente cuando se pasa a fase EJECUCION
 * 
 * @param {number} periodId - ID del período de matrícula
 * @returns {Object} Resumen { created, existing, errors, credentials[] }
 */
const createAccountsForAssignedTeachers = async (periodId) => {
  console.log(`\n👨‍🏫 Creando cuentas para profesores asignados del período ${periodId}...`);

  // Obtener todos los profesores asignados a talleres del período
  const teachersQuery = await db.query(`
    SELECT DISTINCT
      t.id,
      t.full_name,
      t.email,
      t.user_id,
      t.school_id,
      s.name as school_name,
      wat.is_main_referent
    FROM workshop_assigned_teachers wat
    JOIN teachers t ON t.id = wat.teacher_id
    JOIN workshop_editions we ON we.id = wat.workshop_edition_id
    JOIN schools s ON s.id = t.school_id
    WHERE we.enrollment_period_id = $1
    ORDER BY t.full_name
  `, [periodId]);

  const teachers = teachersQuery.rows;
  console.log(`📋 Total profesores asignados: ${teachers.length}`);

  const results = {
    total: teachers.length,
    created: 0,
    existing: 0,
    errors: 0,
    credentials: [] // Para enviar emails después
  };

  for (const teacher of teachers) {
    const result = await createTeacherAccount(teacher);

    if (result.created) {
      results.created++;
      results.credentials.push({
        email: result.email,
        password: result.password,
        name: result.name
      });
      console.log(`✅ Cuenta creada: ${teacher.full_name} (${teacher.email})`);
    } else if (result.reason === 'already_exists' || result.reason === 'linked_existing') {
      results.existing++;
      console.log(`ℹ️ Cuenta existente: ${teacher.full_name}`);
    } else if (result.reason === 'no_email') {
      results.errors++;
      console.log(`⚠️ Sin email: ${teacher.full_name}`);
    } else {
      results.errors++;
      console.log(`❌ Error: ${teacher.full_name} - ${result.error}`);
    }
  }

  // Enviar credenciales por email
  let emailsSent = 0;
  let emailErrors = 0;
  
  for (const cred of results.credentials) {
    try {
      const sent = await emailService.sendTeacherCredentials(cred.email, cred.password, cred.name);
      if (sent.success) {
        emailsSent++;
      } else {
        emailErrors++;
      }
    } catch (err) {
      emailErrors++;
      console.error(`Error enviando email a ${cred.email}:`, err.message);
    }
  }

  results.emailsSent = emailsSent;
  results.emailErrors = emailErrors;

  console.log(`\n📊 Resumen creación de cuentas:`);
  console.log(`   - Nuevas: ${results.created}`);
  console.log(`   - Existentes: ${results.existing}`);
  console.log(`   - Errores: ${results.errors}`);
  console.log(`   - Emails enviados: ${emailsSent}`);

  return results;
};

/**
 * Obtiene los talleres donde un profesor está asignado
 * @param {number} userId - ID del usuario (no del profesor)
 * @returns {Array} Lista de workshop_editions con info del taller
 */
const getTeacherWorkshops = async (userId) => {
  const result = await db.query(`
    SELECT 
      we.id as edition_id,
      we.workshop_id,
      w.title as workshop_title,
      w.provider_id,
      p.name as provider_name,
      we.day_of_week,
      we.start_time,
      we.end_time,
      we.capacity_total as max_students,
      wat.is_main_referent,
      t.id as teacher_id,
      t.full_name as teacher_name,
      (SELECT COUNT(*) FROM allocations a WHERE a.workshop_edition_id = we.id AND a.status IN ('PROVISIONAL', 'PUBLISHED', 'ACCEPTED')) as allocations_count,
      (SELECT COALESCE(SUM(a.assigned_seats), 0) FROM allocations a WHERE a.workshop_edition_id = we.id AND a.status IN ('PROVISIONAL', 'PUBLISHED', 'ACCEPTED')) as total_students
    FROM workshop_assigned_teachers wat
    JOIN teachers t ON t.id = wat.teacher_id
    JOIN workshop_editions we ON we.id = wat.workshop_edition_id
    JOIN workshops w ON w.id = we.workshop_id
    JOIN providers p ON p.id = w.provider_id
    WHERE t.user_id = $1
    ORDER BY we.day_of_week ASC
  `, [userId]);

  return result.rows;
};

/**
 * Verifica si un profesor puede acceder a una edición de taller específica
 * @param {number} userId - ID del usuario
 * @param {number} editionId - ID de la edición del taller
 * @returns {boolean}
 */
const canAccessWorkshop = async (userId, editionId) => {
  const result = await db.query(`
    SELECT 1 FROM workshop_assigned_teachers wat
    JOIN teachers t ON t.id = wat.teacher_id
    WHERE t.user_id = $1 AND wat.workshop_edition_id = $2
    LIMIT 1
  `, [userId, editionId]);

  return result.rows.length > 0;
};

module.exports = {
  generatePassword,
  createTeacherAccount,
  createAccountsForAssignedTeachers,
  getTeacherWorkshops,
  canAccessWorkshop
};
