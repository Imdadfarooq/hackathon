const express = require('express');
const mentorController = require('../controllers/mentorController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('mentor'));

router.get('/students', mentorController.listStudents);
router.get('/students/:studentId', mentorController.getStudentDetail);
router.get('/students/:studentId/export', mentorController.exportStudentCSV);

module.exports = router;
