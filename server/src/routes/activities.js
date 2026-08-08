const express = require('express');
const { body } = require('express-validator');
const activityController = require('../controllers/activityController');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const ActivityEvent = require('../models/ActivityEvent');

const router = express.Router();

router.use(requireAuth, requireRole('student'));

const recordRules = [
  body('type')
    .isIn(ActivityEvent.EVENT_TYPES)
    .withMessage(`type must be one of: ${ActivityEvent.EVENT_TYPES.join(', ')}`),
  body('courseId').optional().isMongoId().withMessage('courseId must be a valid id'),
  body('lessonId').optional().isMongoId().withMessage('lessonId must be a valid id'),
  body('durationMinutes')
    .optional()
    .isFloat({ min: 0, max: 1440 })
    .withMessage('durationMinutes must be between 0 and 1440'),
  body('score').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
  body('occurredAt').optional().isISO8601().withMessage('occurredAt must be an ISO date'),
];

router.post('/', recordRules, validate, activityController.recordActivity);
router.get('/', activityController.listActivities);

module.exports = router;
