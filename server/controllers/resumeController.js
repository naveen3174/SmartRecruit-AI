const User = require('../models/User');
const axios = require('axios');

const uploadResume = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const base64Data = file.buffer.toString("base64");
    const mimeType = file.mimetype.includes('pdf') ? "application/pdf" : "image/jpeg";

    console.log(`[OpenRouter] Parsing resume: ${file.originalname} (${mimeType})`);

    // Using Gemini 2.0 Flash via OpenRouter for multimodal parsing
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              },
              {
                type: "text",
                text: "Extract all the text from this resume. Return only the plain text content of the resume."
              }
            ]
          }
        ]
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

    const resumeText = response.data.choices[0].message.content;

    await User.findByIdAndUpdate(req.user.userId, {
      resumeUrl: file.path,
      resumeText: resumeText
    });

    res.json({ message: 'Resume uploaded and parsed successfully' });
  } catch (error) {
    console.error('Resume upload error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process resume' });
  }
};

const getResumeStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ hasResume: !!user.resumeUrl, resumeUrl: user.resumeUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
}

module.exports = { uploadResume, getResumeStatus };
