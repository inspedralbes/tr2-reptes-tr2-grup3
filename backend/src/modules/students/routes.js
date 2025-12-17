/**
 * students/routes.js
 * 
 * Rutes per a la gestió d'alumnes i documents
 * US #16: Pujada de documentació (Checklist)
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../../common/middleware/authMiddleware');
const {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  uploadDocument,
  listDocuments,
  verifyDocument,
  deleteDocument,
} = require('./controller');

const router = express.Router();

// Configuració de Multer per a pujada de fitxers
const uploadDir = path.join(__dirname, '../../../uploads/documents');

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}_${uniqueSuffix}${ext}`);
  }
});

// Filtre per acceptar només PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Només s\'accepten fitxers PDF'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Màxim 5MB
  }
});

// ==========================================
// RUTES D'ALUMNES
// ==========================================

// GET - Llistar alumnes
router.get('/', authenticate, listStudents);

// GET - Obtenir alumne per ID
router.get('/:id', authenticate, getStudentById);

// POST - Crear alumne
router.post('/', authenticate, createStudent);

// PUT - Actualitzar alumne
router.put('/:id', authenticate, updateStudent);

// ==========================================
// RUTES DE DOCUMENTS
// ==========================================

// GET - Llistar documents d'un alumne
router.get('/:id/documents', authenticate, listDocuments);

// POST - Pujar document per a un alumne (US #16)
router.post('/:id/documents', authenticate, upload.single('document'), uploadDocument);

// PUT - Verificar document (només ADMIN)
router.put('/documents/:docId/verify', authenticate, verifyDocument);

// DELETE - Eliminar document
router.delete('/documents/:docId', authenticate, deleteDocument);

module.exports = router;
