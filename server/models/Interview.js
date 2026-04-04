const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobDescription: { type: String, required: true },
  transcript: { type: String },
  videoUrl: { type: String },
  analysis: {
    overallScore: Number,
    communicationScore: Number,
    technicalScore: Number,
    confidenceScore: Number,
    jobMatchScore: Number,
    sentiment: String,
    emotions: [String],
    strengths: [String],
    weaknesses: [String],
    missingSkills: [String],
    hrTips: [String],
    summaryRecommendation: String,
    fillerWords: Number,
    feedback: String
  },
  metrics: {
    eyeContact: Number,
    smileFrequency: Number,
    speakingSpeed: Number,
    pauseFrequency: String
  },
  questions: [{
    questionText: String,
    answerText: String,
    wasAnswered: Boolean,
    feedback: String
  }],
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', InterviewSchema);
