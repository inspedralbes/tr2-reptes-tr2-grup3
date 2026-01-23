const { signToken } = require("../../common/jwtHelpers");
const db = require("../../config/db");

/**
 * Autentica un usuario validando email contra la base de datos
 * Busca primero en tabla 'users' y luego en 'teachers'
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña (validada con bcrypt)
 * @returns {Promise<{user: Object, token: string}>} Usuario autenticado y token JWT
 */
const login = async ({ email, password }) => {
  const bcrypt = require("bcrypt");

  try {
    // 1. Primero buscar en tabla users (ADMIN, CENTER_COORD)
    const userResult = await db.query(
      "SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (userResult.rows.length > 0) {
      // Usuario encontrado en tabla users
      const user = userResult.rows[0];

      // Validar contraseña con bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Si es coordinador, buscar su escuela
      let school_id = null;
      if (user.role === "CENTER_COORD") {
        const schoolRes = await db.query(
          "SELECT id FROM schools WHERE coordinator_user_id = $1",
          [user.id]
        );
        if (schoolRes.rows.length > 0) {
          school_id = schoolRes.rows[0].id;
        }
      }

      // Generar token JWT
      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.full_name,
        school_id,
        user_type: 'user', // Para distinguir el tipo
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          school_id,
          user_type: 'user',
        },
        token,
      };
    }

    // 2. Si no está en users, buscar en teachers (profesores acompañantes)
    const teacherResult = await db.query(
      "SELECT id, email, full_name, password_hash, school_id FROM teachers WHERE email = $1 LIMIT 1",
      [email]
    );

    if (teacherResult.rows.length > 0) {
      const teacher = teacherResult.rows[0];

      // Verificar que tenga password
      if (!teacher.password_hash) {
        throw new Error("Teacher account not activated. Contact your coordinator.");
      }

      // Validar contraseña
      const isPasswordValid = await bcrypt.compare(password, teacher.password_hash);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Generar token JWT para teacher
      const token = signToken({
        id: teacher.id,
        email: teacher.email,
        role: 'TEACHER', // Rol virtual para profesores acompañantes
        name: teacher.full_name,
        school_id: teacher.school_id,
        user_type: 'teacher', // Para distinguir que viene de tabla teachers
      });

      return {
        user: {
          id: teacher.id,
          email: teacher.email,
          name: teacher.full_name,
          role: 'TEACHER',
          school_id: teacher.school_id,
          user_type: 'teacher',
        },
        token,
      };
    }

    // No encontrado en ninguna tabla
    throw new Error("Invalid email or password");

  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

/**
 * Obtiene el perfil del usuario autenticado desde su ID
 * Busca en users o teachers según user_type del token
 * @param {string} userId - ID del usuario desde el JWT
 * @param {string} userType - Tipo de usuario ('user' o 'teacher')
 * @returns {Promise<Object>} Datos completos del usuario
 */
const getProfile = async (userId, userType = 'user') => {
  try {
    if (userType === 'teacher') {
      // Buscar en tabla teachers
      const result = await db.query(
        "SELECT id, email, full_name, school_id FROM teachers WHERE id = $1 LIMIT 1",
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Teacher not found");
      }

      const teacher = result.rows[0];
      return {
        id: teacher.id,
        email: teacher.email,
        name: teacher.full_name,
        role: 'TEACHER',
        school_id: teacher.school_id,
        user_type: 'teacher',
      };
    }

    // Buscar en tabla users
    const result = await db.query(
      "SELECT id, email, full_name, role FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = result.rows[0];

    // Si es coordinador, buscar su escuela en la tabla schools
    let school_id = null;
    if (user.role === "CENTER_COORD") {
      const schoolRes = await db.query(
        "SELECT id FROM schools WHERE coordinator_user_id = $1",
        [user.id]
      );
      if (schoolRes.rows.length > 0) {
        school_id = schoolRes.rows[0].id;
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      school_id,
      user_type: 'user',
    };
  } catch (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
};

module.exports = {
  login,
  getProfile,
};
