/**
 * students/routes.js
 *
 * Rutes per a la gestió d'alumnes i documents
 * US #16: Pujada de documentació (Checklist)
 * 
 * NOTA: La gestión de alumnos está disponible SIEMPRE (sin restricción de fase)
 * Los centros deben poder registrar alumnos antes de hacer solicitudes
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticate } = require("../../common/middleware/authMiddleware");
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

// La gestión de alumnos está disponible SIEMPRE (los centros registran alumnos antes de hacer solicitudes)
// No hay restricción de fase para crear/editar alumnos

// ==========================================
// RUTES D'ALUMNES
// ==========================================

// GET - Llistar alumnes (disponible siempre para coordinadores)
router.get("/", authenticate, listStudents);

// GET - Obtenir alumne per ID
router.get("/:id", authenticate, getStudentById);

// POST - Crear alumne (disponible siempre - se registran antes de hacer solicitudes)
router.post("/", authenticate, createStudent);

// PUT - Actualitzar alumne
router.put("/:id", authenticate, updateStudent);

// ==========================================
// RUTES DE FOTO DE PERFIL
// ==========================================

// Configuració de Multer per a fotos de perfil
const photoUploadDir = path.join(__dirname, "../../../uploads/photos");
if (!fs.existsSync(photoUploadDir)) {
  fs.mkdirSync(photoUploadDir, { recursive: true });
}

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photoUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `student_${req.params.id}_${uniqueSuffix}${ext}`);
  },
});

const photoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Només s'accepten imatges"), false);
  }
};

const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter: photoFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST - Pujar foto de perfil
router.post(
  "/:id/photo",
  authenticate,
  uploadPhoto.single("photo"),
  require("./controller").uploadStudentPhoto
);

// ==========================================
// RUTES DE DOCUMENTS
// ==========================================

// GET - Llistar documents d'un alumne
router.get("/:id/documents", authenticate, listDocuments);

// GET - Descarregar document (requereix autenticació)
router.get("/documents/:docId/download", authenticate, require("./controller").downloadDocument);

// POST - Pujar document per a un alumne (US #16)
router.post(
  "/:id/documents",
  authenticate,
  upload.single("document"),
  uploadDocument
);

// PUT - Verificar document (només ADMIN)
router.put("/documents/:docId/verify", authenticate, verifyDocument);

// DELETE - Eliminar document
router.delete("/documents/:docId", authenticate, deleteDocument);

// DELETE - Eliminar alumne (US #95 CRUD)
router.delete("/:id", authenticate, deleteStudent);

module.exports = router;
