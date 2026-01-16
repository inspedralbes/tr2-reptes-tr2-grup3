const path = require("path");
const fs = require("fs");
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split("\n").forEach((line) => {
        const [key, val] = line.split("=");
        if (key && val) {
            process.env[key.trim()] = val.trim();
        }
    });
}
const db = require("./src/config/db");

(async () => {
    try {
        console.log("Running Schema Updates for Teachers (Phone Number)...");

        // Add phone_number column to teachers table
        await db.query(
            `ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)`
        );

        console.log("Schema updated: phone_number column added to teachers table.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
})();
