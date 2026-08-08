const express = require('express');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const courseRoutes = require('./courses');
const activityRoutes = require('./activities');
const recommendationRoutes = require('./recommendations');
const mentorRoutes = require('./mentor');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/courses', courseRoutes);
router.use('/activities', activityRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/mentor', mentorRoutes);

module.exports = router;
