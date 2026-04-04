const axios = require('axios');
const Interview = require('../models/Interview');

const handleChat = async (req, res) => {
  try {
    const { interviewId, message } = req.body;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    const questions = interview.questions || [];
    const questionsList = questions.length > 0 
      ? questions.map((q, idx) => `Sawalan ${idx + 1}: ${q.questionText}`).join('\n')
      : "No questions found in this interview record.";

    const prompt = `System Role: You are "SmartRecruit Bhai", a direct-talking Senior Developer. 
    Forget being an "AI Assistant". Stop giving encouraging feedback or vague guidance. 
    Your ONLY job is to give the EXACT TECHNICAL ANSWERS in Hinglish when asked.

    INTERVIEW DATA:
    - Job Description: ${interview.jobDescription}
    - Questions asked in this session:
    ${questionsList}
    
    - User's Transcript: "${interview.transcript}"

    CANDIDATE'S MESSAGE: "${message}"

    RULES FOR RESPONSE:
    1. If the candidate asks for the answer to a question (e.g. "2nd question"), give the perfect technical answer for that specific question instantly.
    2. Respond ONLY in Hinglish (Hindi words written in English + English technical terms).
    3. Use a "Bhai" or "Senior Dev" vibe. No corporate fluff. No "It's great you're asking".
    4. If they specify a word limit (like 30 words), you MUST NOT exceed it.
    5. If the questions list above is empty, tell them: "Bhai, is interview record me questions nahi mile."
    6. GIVE THE SOLUTION. DO NOT JUST GUIDE.`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.0-flash-001",
        messages: [
          { 
            role: "system", 
            content: "You are SmartRecruit Bhai. You give direct technical answers in Hinglish. You never refuse to give a direct answer. You never give vague guidance." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "Http-Referer": "http://localhost:3000",
          "X-Title": "SmartRecruit AI"
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Coach is currently unavailable' });
  }
};

module.exports = { handleChat };
