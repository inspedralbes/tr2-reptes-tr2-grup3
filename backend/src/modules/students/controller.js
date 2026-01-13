/**
 * students/controller.js
 *
 * US #16: Gestió d'alumnes i pujada de documents (autoritzacions)
 * Permet als centres pujar PDFs d'autoritzacions per a cada alumne
 */
const db = require("../../config/db");
const path = require("path");
const fs = require("fs");

/**
 * GET /api/students
 * Llista alumnes amb filtres opcionals
 * Query params: ?school_id=X&allocation_id=Y
 */
const listStudents = async (req, res) => {
  const { school_id, allocation_id } = req.query;

  try {
    let query = `
      SELECT s.id, s.idalu, s.full_name, s.school_id, s.dni_front_url, s.dni_back_url, s.created_at,
             sc.name as school_name
      FROM students s
      LEFT JOIN schools sc ON s.school_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (school_id) {
      params.push(school_id);
      query += ` AND s.school_id = $${params.length}`;
    }

    if (allocation_id) {
      // Filtrar per alumnes assignats a una allocation específica
      params.push(allocation_id);
      query += ` AND s.id IN (SELECT student_id FROM allocation_students WHERE allocation_id = $${params.length})`;
    }

    query += " ORDER BY s.full_name";

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: `Error llistant alumnes: ${error.message}` });
  }
};

/**
 * GET /api/students/:id
 * Obtenir detalls d'un alumne amb els seus documents
 */
const getStudentById = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtenir alumne
    const studentResult = await db.query(
      `SELECT s.*, sc.name as school_name
       FROM students s
       LEFT JOIN schools sc ON s.school_id = sc.id
       WHERE s.id = $1`,
      [id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Alumne no trobat" });
    }

    const student = studentResult.rows[0];

    // Obtenir documents de l'alumne
    const docsResult = await db.query(
      `SELECT id, document_type, file_url, uploaded_at, is_verified
       FROM student_documents
       WHERE student_id = $1
       ORDER BY uploaded_at DESC`,
      [id]
    );

    student.documents = docsResult.rows;

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: `Error obtenint alumne: ${error.message}` });
  }
};

/**
 * POST /api/students
 * Crear nou alumne (quan el centre confirma nominalment)
 */
const createStudent = async (req, res) => {
  let { full_name, idalu, school_id } = req.body;
  const user = req.user;

  if (!full_name) {
    return res.status(400).json({ error: "full_name és requerit" });
  }

  try {
    // Si es coordinador de centro y no pasamos school_id, buscarlo automatico
    if (user.role === "CENTER_COORD" && !school_id) {
      const schoolCheck = await db.query(
        "SELECT id FROM schools WHERE coordinator_user_id = $1",
        [user.id]
      );
      if (schoolCheck.rows.length > 0) {
        school_id = schoolCheck.rows[0].id;
      } else {
        return res
          .status(403)
          .json({ error: "L'usuari no té cap escola assignada." });
      }
    }

    if (!school_id) {
      return res.status(400).json({ error: "school_id és requerit" });
    }

    const result = await db.query(
      `INSERT INTO students (full_name, idalu, school_id)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, idalu, school_id, created_at`,
      [full_name, idalu || null, school_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: `Error creant alumne: ${error.message}` });
  }
};

/**
 * PUT /api/students/:id
 * Actualitzar dades d'un alumne
 */
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { full_name, idalu } = req.body;

  try {
    const result = await db.query(
      `UPDATE students
       SET full_name = COALESCE($1, full_name),
           idalu = COALESCE($2, idalu)
       WHERE id = $3
       RETURNING id, full_name, idalu, dni_front_url, dni_back_url, school_id, created_at`,
      [full_name, idalu, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alumne no trobat" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error actualitzant alumne: ${error.message}` });
  }
};

/**
 * POST /api/students/:id/documents
 * Pujar document PDF o Imatge per a un alumne (autorització o DNI)
 */
const uploadDocument = async (req, res) => {
  const { id } = req.params;
  const { document_type } = req.body;

  // Verificar que s'ha pujat un fitxer
  if (!req.file) {
    return res.status(400).json({ error: "No s'ha pujat cap fitxer" });
  }

  // Verificar tipus de document vàlid
  const validTypes = [
    "AUTORITZACIO_IMATGE",
    "AUTORITZACIO_SORTIDA",
    "ALTRES",
    "DNI_FRONT",
    "DNI_BACK",
  ];
  if (!document_type || !validTypes.includes(document_type)) {
    return res.status(400).json({
      error: "Tipus de document invàlid.",
    });
  }

  try {
    // Verificar que l'alumne existeix
    const studentCheck = await db.query(
      "SELECT id FROM students WHERE id = $1",
      [id]
    );
    if (studentCheck.rows.length === 0) {
      // Eliminar fitxer pujat si l'alumne no existeix
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Alumne no trobat" });
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;

    // Si es DNI, actualizar la columna en la tabla students
    if (document_type === "DNI_FRONT") {
      await db.query(`UPDATE students SET dni_front_url = $1 WHERE id = $2`, [
        fileUrl,
        id,
      ]);
    } else if (document_type === "DNI_BACK") {
      await db.query(`UPDATE students SET dni_back_url = $1 WHERE id = $2`, [
        fileUrl,
        id,
      ]);
    }

    // Tambien guardar en historial de documentos (opcional, pero util)
    const result = await db.query(
      `INSERT INTO student_documents (student_id, document_type, file_url)
       VALUES ($1, $2, $3)
       RETURNING id, student_id, document_type, file_url, uploaded_at, is_verified`,
      [id, document_type, fileUrl]
    );

    res.status(201).json({
      message: "Document pujat correctament",
      document: result.rows[0],
      fileUrl: fileUrl,
    });
  } catch (error) {
    // Si hi ha error, eliminar el fitxer pujat
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: `Error pujant document: ${error.message}` });
  }
};

/**
 * GET /api/students/:id/documents
 * Llistar documents d'un alumne
 */
const listDocuments = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id, document_type, file_url, uploaded_at, is_verified
       FROM student_documents
       WHERE student_id = $1
       ORDER BY uploaded_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error llistant documents: ${error.message}` });
  }
};

/**
 * PUT /api/students/documents/:docId/verify
 * Verificar un document (només ADMIN)
 */
const verifyDocument = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Només els admins poden verificar documents" });
  }

  const { docId } = req.params;
  const { is_verified } = req.body;

  try {
    const result = await db.query(
      `UPDATE student_documents
       SET is_verified = $1
       WHERE id = $2
       RETURNING id, student_id, document_type, file_url, uploaded_at, is_verified`,
      [is_verified !== false, docId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document no trobat" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error verificant document: ${error.message}` });
  }
};

/**
 * DELETE /api/students/documents/:docId
 * Eliminar un document
 */
const deleteDocument = async (req, res) => {
  const { docId } = req.params;

  try {
    // Obtenir info del document per eliminar el fitxer físic
    const docResult = await db.query(
      "SELECT file_url FROM student_documents WHERE id = $1",
      [docId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: "Document no trobat" });
    }

    // Eliminar de la BD
    await db.query("DELETE FROM student_documents WHERE id = $1", [docId]);

    // Intentar eliminar el fitxer físic
    const filePath = path.join(
      __dirname,
      "../../../uploads",
      docResult.rows[0].file_url.replace("/uploads/", "")
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Document eliminat correctament" });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error eliminant document: ${error.message}` });
  }
};

/**
 * DELETE /api/students/:id
 * Eliminar un alumne
 * Comprovar que pertany a l'escola de l'usuari (si és CENTER_COORD)
 * Comprovar que no estigui assignat a cap taller
 */
const deleteStudent = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // 1. Obtenir l'alumne per verificar permisos
    const studentCheck = await db.query(
      "SELECT * FROM students WHERE id = $1",
      [id]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: "Alumne no trobat" });
    }

    const student = studentCheck.rows[0];

    // 2. Si és coordinador, verificar que l'alumne és de la seva escola
    if (user.role === "CENTER_COORD") {
      // Obtenir l'escola del coordinador
      const schoolCheck = await db.query(
        "SELECT id FROM schools WHERE coordinator_user_id = $1",
        [user.id]
      );

      if (schoolCheck.rows.length === 0) {
        return res.status(403).json({ error: "No tens escola assignada" });
      }

      if (student.school_id !== schoolCheck.rows[0].id) {
        return res
          .status(403)
          .json({ error: "No pots eliminar alumnes d'altres centres" });
      }
    }

    // 3. Verificar si té assignacions a tallers
    // Taula allocation_students: id, allocation_id, student_id...
    const allocationCheck = await db.query(
      "SELECT id FROM allocation_students WHERE student_id = $1",
      [id]
    );

    if (allocationCheck.rows.length > 0) {
      return res.status(400).json({
        error:
          "No es pot eliminar l'alumne perquè ja està assignat a tallers. Primer elimina l'assignació.",
      });
    }

    // 4. Procedir a eliminar (ON DELETE CASCADE s'encarregarà dels documents i logs d'assistència si estan configurats,
    // però millor comprovar constraints. Segons init.sql:
    // student_documents -> ON DELETE CASCADE
    // attendance_logs -> Sense cascade explícit (per defecte RESTRICT o NO ACTION, però sol ser RESTRICT)
    // student_grades -> ON DELETE CASCADE)

    // Per seguretat, comprovem attendance_logs
    const logsCheck = await db.query(
      "SELECT id FROM attendance_logs WHERE student_id = $1",
      [id]
    );
    if (logsCheck.rows.length > 0) {
      return res.status(400).json({
        error: "No es pot eliminar l'alumne perquè té registres d'assistència.",
      });
    }

    await db.query("DELETE FROM students WHERE id = $1", [id]);

    res.json({ message: "Alumne eliminat correctament" });
  } catch (error) {
    res.status(500).json({ error: `Error eliminant alumne: ${error.message}` });
  }
};

module.exports = {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  uploadDocument,
  listDocuments,
  verifyDocument,
  deleteDocument,
  deleteStudent,
};
