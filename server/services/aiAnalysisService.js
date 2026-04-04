const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Helper to extract JSON from AI response if it contains markdown or garbage
 */
const extractJSON = (text) => {
  if (!text) return { questions: [] };
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to find JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (inner) {
        // Last resort: try to fix common JSON errors like trailing commas
        let fixed = match[0].replace(/,\s*([\}\]])/g, '$1');
        try {
          return JSON.parse(fixed);
        } catch (f) {
          throw new Error("Could not parse JSON from AI response");
        }
      }
    }
    throw e;
  }
};

/**
 * Generate Interview Questions using OpenRouter
 */
const generateInterviewQuestions = async (jobDescription, retryCount = 0) => {
  console.log(`[OpenRouter] Generating questions for: ${jobDescription.substring(0, 50)}...`);
  
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "google/gemini-2.0-flash-001", // Using 2.0 Flash as primary
        messages: [
          {
            role: "system",
            content: "You are an expert technical recruiter. Generate 5 relevant interview questions based on the job description. Respond ONLY with a valid JSON object. Format: { \"questions\": [\"Q1\", \"Q2\", ...] }"
          },
          {
            role: "user",
            content: `Job Description: ${jobDescription}`
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SmartRecruit AI"
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0].message.content;
    const parsed = extractJSON(content);
    console.log("[OpenRouter] Questions generated successfully.");
    return parsed.questions || [];
  } catch (error) {
    console.error('--- OPENROUTER ERROR ---', error.response?.data || error.message);
    
    // Fallback to 1.5 Flash if 2.0 fails or 404s
    if (retryCount === 0) {
        console.log("[OpenRouter] trying fallback model for questions...");
        return generateInterviewQuestions(jobDescription, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Analyze Interview Performance using OpenRouter
 */
const analyzeInterviewPerformance = async (transcript, jobDescription, resumeText = "", retryCount = 0, questionsAsked = []) => {
  console.log("[OpenRouter] Analyzing interview performance...");
  
  try {
    const prompt = `You are a high-level Technical Interviewer and AI HR specialist. 
    Analyze the provided interview transcript against the job description and the list of questions that were asked.
    
    QUESTIONS ASKED: ${JSON.stringify(questionsAsked)}
    
    TRANSCRIPT: "${transcript}"
    JOB DESCRIPTION: "${jobDescription}"
    RESUME: "${resumeText}"

    Respond ONLY with a valid JSON object:
    {
      "overallScore": 0-100,
      "communicationScore": 0-100,
      "technicalScore": 0-100,
      "confidenceScore": 0-100,
      "jobMatchScore": 0-100,
      "sentiment": "string",
      "emotions": [],
      "strengths": [],
      "weaknesses": [],
      "missingSkills": [],
      "hrTips": [],
      "summaryRecommendation": "string",
      "questionsAnalysis": [
        {
          "question": "exact question string from QUESTIONS ASKED",
          "wasAnswered": true/false,
          "summaryOfAnswer": "brief summary of what the candidate said for this question"
        }
      ]
    }`;

    const response = await axios.post(
      API_URL,
      {
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: "Analyze the interview and return JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SmartRecruit AI"
        },
        timeout: 60000
      }
    );

    const content = response.data.choices[0].message.content;
    console.log("[OpenRouter] Analysis complete.");
    return extractJSON(content);
  } catch (error) {
    console.error('OpenRouter AI analysis error:', error.response?.data || error.message);
    if (error.response?.status === 429 && retryCount < 2) {
      await new Promise(res => setTimeout(res, 5000));
      return analyzeInterviewPerformance(transcript, jobDescription, resumeText, retryCount + 1);
    }
    throw error;
  }
};

module.exports = { generateInterviewQuestions, analyzeInterviewPerformance };
