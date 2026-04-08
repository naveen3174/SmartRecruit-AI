const Interview = require('../models/Interview');
const User = require('../models/User');
const { transcribeAudio } = require('../services/whisperService');
const { analyzeInterviewPerformance } = require('../services/aiAnalysisService');
const { detectFillerWords } = require('../services/fillerWordAnalyzer');

const startAnalysis = async (req, res) => {
  try {
    const { jobDescription, questions } = req.body;
    const file = req.file;
    
    if (!file || !jobDescription) {
      return res.status(400).json({ error: 'Video file and job description are required' });
    }

    console.log(`[Upload] Received file: ${file.originalname}, Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const parsedQuestions = questions ? JSON.parse(questions) : [];

    // Create a new interview record
    const interview = new Interview({
      userId: req.user.userId,
      jobDescription,
      questions: parsedQuestions.map(q => ({ questionText: q })),
      status: 'processing'
    });
    await interview.save();

    // Fetch user resume if available
    const user = await User.findById(req.user.userId);
    const resumeText = user?.resumeText || "";

    // Trigger background analysis — pass the in-memory buffer, not a file path
    // (Render has an ephemeral filesystem; files saved to disk disappear on restart)
    processAnalysis(interview._id, file.buffer, jobDescription, file.mimetype, resumeText, parsedQuestions);

    res.json({ 
      message: 'Analysis started', 
      interviewId: interview._id 
    });
  } catch (error) {
    console.error('Start analysis error:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
};

const processAnalysis = async (interviewId, fileBuffer, jobDescription, mimetype, resumeText = "", questionsAsked = []) => {
  try {
    // 1. Transcribe (Must have API key and working quota)
    let transcript = "";
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (apiKey) {
      console.log('--- STARTING TRANSCRIPTION ---');
      try {
        transcript = await transcribeAudio(fileBuffer, mimetype);
        console.log('--- TRANSCRIPTION COMPLETE ---');
      } catch (err) {
        console.error('Transcription failed:', err.message);
        transcript = `[System Message: Transcription failed due to technical error: ${err.message}. The candidate's audio could not be processed.]`;
      }
    } else {
      throw new Error("OPENROUTER_API_KEY is missing in .env");
    }

    // 2. Detect Filler Words
    const fillerStats = detectFillerWords(transcript);

    // 3. AI Analysis
    let analysisResult = {};

    if (apiKey) {
      console.log('--- STARTING AI ANALYSIS ---');
      analysisResult = await analyzeInterviewPerformance(transcript, jobDescription, resumeText, 0, questionsAsked);
      console.log('--- AI ANALYSIS COMPLETE ---');
    }

    // Prepare questions analysis (Mapping AI response back to schema)
    const questionsAnalysis = analysisResult.questionsAnalysis || [];
    const updatedQuestions = questionsAsked.map(q => {
      const match = questionsAnalysis.find(aq => aq.question.includes(q) || q.includes(aq.question));
      return {
        questionText: q,
        wasAnswered: match ? match.wasAnswered : false,
        answerText: match ? match.summaryOfAnswer : "No clear answer detected."
      };
    });

    // 4. Update Interview record
    await Interview.findByIdAndUpdate(interviewId, {
      transcript,
      analysis: { ...analysisResult, fillerWords: fillerStats.totalFillerCount },
      questions: updatedQuestions,
      status: 'completed'
    });

  } catch (error) {
    console.error('Background processing error:', error);
    await Interview.findByIdAndUpdate(interviewId, { status: 'failed' });
  }
};

const getInterviewResults = async (req, res) => {
  try {
    const interview = await Interview.findOne({ 
      _id: req.params.id,
      userId: req.user.userId 
    });
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found or access denied' });
    }
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};

const getInterviewHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = { startAnalysis, getInterviewResults, getInterviewHistory };
