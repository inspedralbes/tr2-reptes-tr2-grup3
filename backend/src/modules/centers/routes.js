const express = require("express");
const router = express.Router();
const controller = require("./controller");
const multer = require("multer");

// Configurar multer para archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos CSV"));
    }
  },
});

router.get("/", controller.getAllCenters);
router.get("/export", controller.exportCentersToCSV);
router.get("/:id", controller.getCenterById);
router.post("/", controller.createCenter);
router.post("/import", upload.single("file"), controller.importCentersFromCSV);
router.put("/:id", controller.updateCenter);
router.delete("/:id", controller.deleteCenter);

module.exports = router;
