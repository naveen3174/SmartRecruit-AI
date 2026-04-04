const User = require('../models/User');
const Interview = require('../models/Interview');

const getGlobalStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const interviewCount = await Interview.countDocuments();
    
    // Calculate average success rate (overall score)
    const averageScoreResult = await Interview.aggregate([
      { $match: { status: 'completed', 'analysis.overallScore': { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: "$analysis.overallScore" } } }
    ]);

    const successRate = averageScoreResult.length > 0 
      ? Math.round(averageScoreResult[0].avgScore) 
      : 0;

    res.json({
      activeUsers: userCount,
      interviewsAnalyzed: interviewCount,
      successRate: successRate,
      partners: Math.max(5, Math.floor(userCount / 2)) // Just a dynamic placeholder for partners based on user count
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

const getPublicResults = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    // Only allow viewing completed interviews publicly for safety
    if (interview.status !== 'completed') {
      return res.status(403).json({ error: 'This report is still being processed or failed' });
    }
    res.json(interview);
  } catch (error) {
    console.error('Error fetching public results:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

module.exports = { getGlobalStats, getPublicResults };
