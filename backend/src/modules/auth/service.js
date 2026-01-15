const { signToken } = require("../../common/jwtHelpers");
const db = require("../../config/db");

/**
 * Autentica un usuario validando email contra la base de datos
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña (será validada en futuro con bcrypt)
 * @returns {Promise<{user: Object, token: string}>} Usuario autenticado y token JWT
 */
const login = async ({ email, password }) => {
  const bcrypt = require("bcrypt");

  try {
    // Consultar usuario en BD por email (necesitamos el password_hash)
    const result = await db.query(
      "SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result.rows[0];

    // Validar contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

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

    // Generar token JWT con los datos del usuario INCLUYENDO school_id
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
      school_id, // Añadimos school_id al token
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        school_id,
      },
      token,
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

/**
 * Obtiene el perfil del usuario autenticado desde su ID
 * @param {string} userId - ID del usuario desde el JWT
 * @returns {Promise<Object>} Datos completos del usuario
 */
const getProfile = async (userId) => {
  try {
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
      school_id, // Añadir school_id
    };
  } catch (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
};

module.exports = {
  login,
  getProfile,
};
