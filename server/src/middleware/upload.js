const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Keep uploads in memory so the bytes can be written straight to MongoDB
// (no filesystem dependency — works in tests and containers).
const storage = multer.memoryStorage();

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function pdfOnly(req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    return cb(null, true);
  }
  return cb(ApiError.badRequest('Only PDF files are allowed'));
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: pdfOnly,
});

// Single-file upload under the "file" field.
const uploadPdf = upload.single('file');

module.exports = { uploadPdf };
