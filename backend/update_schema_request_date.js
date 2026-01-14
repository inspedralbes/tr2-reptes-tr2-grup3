require("dotenv").config({ path: "./backend/.env" });
const pool = require("./src/config/db");

async function runMigration() {
  const client = await pool.pool.connect();
  try {
    console.log("Adding preferred_date to request_items table...");

    // Add preferred_date column (DATE type, nullable)
    await client.query(`
      ALTER TABLE request_items 
      ADD COLUMN IF NOT EXISTS preferred_date DATE;
    `);

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    process.exit();
  }
}

runMigration();
