const db = require("../../config/db");

const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = "SELECT id, full_name, email, role FROM users";
    const params = [];

    if (role) {
      query += " WHERE role = $1";
      params.push(role);
    }

    query += " ORDER BY full_name ASC";

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listUsers,
};
