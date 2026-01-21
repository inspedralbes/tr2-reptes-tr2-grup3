/**
 * students/routes.js
 *
 * Rutes per a la gestió d'alumnes i documents
 * US #16: Pujada de documentació (Checklist)
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticate } = require("../../common/middleware/authMiddleware");
const { requirePhase } = require("../../common/middleware/phaseMiddleware");
const {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  uploadDocument,
  listDocuments,
  verifyDocument,
  deleteDocument,
  deleteStudent,
} = require("./controller");

const router = express.Router();

// Configuració de Multer per a pujada de fitxers
const uploadDir = path.join(__dirname, "../../../uploads/documents");

// Crear directori si no existeix
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: studentId_timestamp_originalname.pdf
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}_${uniqueSuffix}${ext}`);
  },
});

// Filtre per acceptar només PDFs i Imatges
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("image/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Només s'accepten fitxers PDF o imatges"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Màxim 5MB
  },
});

// Gestió d'alumnes disponible en PUBLICACION (inscripcions) i EJECUCION
const canManageStudents = requirePhase(['PUBLICACION', 'EJECUCION'], { adminBypass: true });

// ==========================================
// RUTES D'ALUMNES
// ==========================================

// GET - Llistar alumnes (visible després de publicació)
router.get("/", authenticate, canManageStudents, listStudents);

// GET - Obtenir alumne per ID
router.get("/:id", authenticate, canManageStudents, getStudentById);

// POST - Crear alumne (només després de publicació)
router.post("/", authenticate, canManageStudents, createStudent);

// PUT - Actualitzar alumne
router.put("/:id", authenticate, canManageStudents, updateStudent);

// ==========================================
// RUTES DE DOCUMENTS
// ==========================================

// GET - Llistar documents d'un alumne
router.get("/:id/documents", authenticate, canManageStudents, listDocuments);

// POST - Pujar document per a un alumne (US #16)
router.post(
  "/:id/documents",
  authenticate,
  canManageStudents,
  upload.single("document"),
  uploadDocument
);

// PUT - Verificar document (només ADMIN)
router.put("/documents/:docId/verify", authenticate, canManageStudents, verifyDocument);

// DELETE - Eliminar document
router.delete("/documents/:docId", authenticate, canManageStudents, deleteDocument);

// DELETE - Eliminar alumne (US #95 CRUD)
router.delete("/:id", authenticate, canManageStudents, deleteStudent);

module.exports = router;
