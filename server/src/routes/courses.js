const express = require('express');
const courseController = require('../controllers/courseController');
const materialController = require('../controllers/materialController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadPdf } = require('../middleware/upload');

const router = express.Router();

router.use(requireAuth);

router.get('/', courseController.listCourses);
router.get('/:id', courseController.getCourse);
router.get('/:id/lessons/:lessonId', courseController.getLesson);
router.post('/:id/enroll', requireRole('student'), courseController.enroll);

// --- Course materials (PDF content) ---
// Listing and viewing are open to any authenticated user (students + mentors).
router.get('/:id/materials', materialController.listMaterials);
router.get('/:id/materials/:materialId/file', materialController.getMaterialFile);
// Uploading and deleting are mentor-only. Multer parses the multipart body.
router.post('/:id/materials', requireRole('mentor'), uploadPdf, materialController.uploadMaterial);
router.delete('/:id/materials/:materialId', requireRole('mentor'), materialController.deleteMaterial);

module.exports = router;
