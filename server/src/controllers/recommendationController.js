const recommendationService = require('../services/recommendationService');

/**
 * GET /api/recommendations?limit=6
 * Adaptive "next step" recommendations for the current student.
 */
async function getRecommendations(req, res) {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 20);
  const result = await recommendationService.getRecommendations(req.user._id, limit);
  res.json(result);
}

module.exports = { getRecommendations };
