const { generateInterviewQuestions } = require('../services/aiAnalysisService');

const questionCache = new Map();

const getQuestions = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Simple cache to avoid redundant AI calls
    if (questionCache.has(jobDescription)) {
      console.log("[AI] Returning cached questions.");
      return res.json({ questions: questionCache.get(jobDescription) });
    }
    
    const questions = await generateInterviewQuestions(jobDescription);
    questionCache.set(jobDescription, questions);
    
    res.json({ questions });
  } catch (error) {
    console.error("[Question Controller Error]:", error);
    res.status(500).json({ error: 'Failed to generate questions', details: error.message });
  }
};

module.exports = { getQuestions };
