const express = require('express');
const courseController = require('../controllers/courseController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', courseController.listCourses);
router.get('/:id', courseController.getCourse);
router.get('/:id/lessons/:lessonId', courseController.getLesson);
router.post('/:id/enroll', courseController.enroll);

module.exports = router;
