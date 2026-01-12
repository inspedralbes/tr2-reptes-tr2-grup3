const db = require("../../config/db");

// Map 'centers' logic to 'schools' table

const getAllCenters = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM schools ORDER BY name ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting centers:", error);
    res.status(500).json({ message: "Error getting centers" });
  }
};

const getCenterById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM schools WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Center not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error getting center:", error);
    res.status(500).json({ message: "Error getting center" });
  }
};

const createCenter = async (req, res) => {
  try {
    const { name, code } = req.body;
    // Ignoramos campos extra del frontend que no están en DB por ahora (address, city, type)
    const result = await db.query(
      "INSERT INTO schools (name, code) VALUES ($1, $2) RETURNING *",
      [name, code]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating center:", error);
    res.status(500).json({ message: "Error creating center" });
  }
};

const updateCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const result = await db.query(
      "UPDATE schools SET name = $1, code = $2 WHERE id = $3 RETURNING *",
      [name, code, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Center not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating center:", error);
    res.status(500).json({ message: "Error updating center" });
  }
};

const deleteCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM schools WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Center not found" });
    }
    res.json({ message: "Center deleted successfully" });
  } catch (error) {
    console.error("Error deleting center:", error);
    res.status(500).json({ message: "Error deleting center" });
  }
};

const importCentersFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se proporcionó ningún archivo" });
    }

    const { parse } = require("csv-parse/sync");
    const fileContent = req.file.buffer.toString("utf-8");

    // Parsear CSV
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ";",
        trim: true,
      });
    } catch (parseError) {
      return res.status(400).json({
        message:
          "Error al parsear el archivo CSV. Verifica que esté correctamente formateado.",
        error: parseError.message,
      });
    }

    if (records.length === 0) {
      return res.status(400).json({ message: "El archivo CSV está vacío" });
    }

    // Validar columnas requeridas
    const firstRecord = records[0];
    if (
      !firstRecord.hasOwnProperty("Codi_centre") &&
      !firstRecord.hasOwnProperty("code")
    ) {
      return res.status(400).json({
        message:
          'El CSV debe contener las columnas "Codi_centre" o "code" y "Denominació_completa" o "name"',
      });
    }

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    // Procesar cada registro
    for (const record of records) {
      const code = record.Codi_centre || record.code || "";
      const name = record["Denominació_completa"] || record.name || "";

      if (!name || !code) {
        skipped++;
        continue;
      }

      try {
        // Verificar si ya existe
        const exists = await db.query(
          "SELECT id FROM schools WHERE code = $1",
          [code]
        );

        if (exists.rows.length > 0) {
          skipped++;
          continue;
        }

        // Insertar centro
        await db.query("INSERT INTO schools (name, code) VALUES ($1, $2)", [
          name,
          code,
        ]);
        inserted++;
      } catch (insertError) {
        skipped++;
        errors.push({ code, name, error: insertError.message });
      }
    }

    res.json({
      success: true,
      message: `Importación completada: ${inserted} centros insertados, ${skipped} omitidos`,
      details: {
        total: records.length,
        inserted,
        skipped,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
    });
  } catch (error) {
    console.error("Error importing centers:", error);
    res
      .status(500)
      .json({ message: "Error al importar centros: " + error.message });
  }
};

const exportCentersToCSV = async (req, res) => {
  try {
    const { stringify } = require("csv-stringify/sync");

    // Obtener todos los centros
    const result = await db.query(
      "SELECT code, name FROM schools ORDER BY name ASC"
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No hay centros para exportar" });
    }

    // Generar CSV
    const csv = stringify(result.rows, {
      header: true,
      columns: ["code", "name"],
      delimiter: ";",
    });

    // Configurar headers para descarga
    const timestamp = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="centros_${timestamp}.csv"`
    );

    res.send(csv);
  } catch (error) {
    console.error("Error exporting centers:", error);
    res
      .status(500)
      .json({ message: "Error al exportar centros: " + error.message });
  }
};

module.exports = {
  getAllCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
  importCentersFromCSV,
  exportCentersToCSV,
};
