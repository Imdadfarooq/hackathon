const aggregationService = require('../services/aggregationService');
const { toCSV } = require('../utils/csv');

/**
 * GET /api/dashboard/summary
 * KPI cards: total time, completed lessons, course counts, overall progress.
 */
async function getSummary(req, res) {
  const summary = await aggregationService.getStudentSummary(req.user._id);
  res.json(summary);
}

/**
 * GET /api/dashboard/course-progress
 * Per-course progress rows.
 */
async function getCourseProgress(req, res) {
  const rows = await aggregationService.getCourseProgress(req.user._id);
  res.json({ courses: rows });
}

/**
 * GET /api/dashboard/time-series?days=30
 * Daily minutes + lessons completed for the trend chart.
 */
async function getTimeSeries(req, res) {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
  const series = await aggregationService.getTimeSeries(req.user._id, days);
  res.json({ days, series });
}

/**
 * GET /api/dashboard/distribution?by=time|status
 * Data for the pie/donut chart.
 */
async function getDistribution(req, res) {
  const by = req.query.by === 'status' ? 'status' : 'time';
  if (by === 'status') {
    const data = await aggregationService.getCompletionDistribution(req.user._id);
    return res.json({ by, data });
  }
  const data = await aggregationService.getTimeDistribution(req.user._id);
  return res.json({ by, data });
}

/**
 * GET /api/dashboard/export?type=progress|timeseries
 * Streams a CSV download of the student's data (stretch feature).
 */
async function exportCSV(req, res) {
  const type = req.query.type === 'timeseries' ? 'timeseries' : 'progress';

  if (type === 'timeseries') {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
    const series = await aggregationService.getTimeSeries(req.user._id, days);
    const csv = toCSV(series, [
      { key: 'date', label: 'Date' },
      { key: 'minutes', label: 'Minutes' },
      { key: 'lessonsCompleted', label: 'Lessons Completed' },
      { key: 'events', label: 'Events' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="time-series.csv"');
    return res.send(csv);
  }

  const rows = await aggregationService.getCourseProgress(req.user._id);
  const csv = toCSV(rows, [
    { key: 'title', label: 'Course' },
    { key: 'category', label: 'Category' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'status', label: 'Status' },
    { key: 'completedLessons', label: 'Completed Lessons' },
    { key: 'totalLessons', label: 'Total Lessons' },
    { key: 'progress', label: 'Progress (%)' },
    { key: 'timeMinutes', label: 'Time Spent (min)' },
  ]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="course-progress.csv"');
  return res.send(csv);
}

module.exports = {
  getSummary,
  getCourseProgress,
  getTimeSeries,
  getDistribution,
  exportCSV,
};
