const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes are student-facing (mentors use /api/mentor/*).
router.use(requireAuth, requireRole('student'));

router.get('/summary', dashboardController.getSummary);
router.get('/course-progress', dashboardController.getCourseProgress);
router.get('/time-series', dashboardController.getTimeSeries);
router.get('/distribution', dashboardController.getDistribution);
router.get('/export', dashboardController.exportCSV);

module.exports = router;
