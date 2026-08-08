const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('student'));

router.get('/', recommendationController.getRecommendations);

module.exports = router;
