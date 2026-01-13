const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const db = require("./src/config/db");

(async () => {
  try {
    console.log("Running Schema Updates for Global Teachers...");

    // Add request_teachers column to requests table
    await db.query(
      `ALTER TABLE requests ADD COLUMN IF NOT EXISTS request_teachers JSONB DEFAULT '[]'`
    );

    console.log("Schema updated: request_teachers column added.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit();
  }
})();
