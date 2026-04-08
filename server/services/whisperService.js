const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Transcribe Audio using OpenRouter (Gemini 2.0 Flash)
 * @param {Buffer} fileBuffer - The video/audio file as an in-memory Buffer
 * @param {string} mimetype
 */
const transcribeAudio = async (fileBuffer, mimetype = "video/webm", retryCount = 0) => {
  try {
    const fileSizeInMB = fileBuffer.length / (1024 * 1024);
    
    console.log(`[OpenRouter] Transcription Request: ${fileSizeInMB.toFixed(2)} MB`);

    const base64Data = fileBuffer.toString("base64");

    // Safety limit for OpenRouter base64
    if (base64Data.length > 28 * 1024 * 1024) {
      throw new Error("Recording too large. Limit to 15 mins.");
    }

    // Sanitize mimetype
    let openRouterMimeType = mimetype.split(';')[0];
    if (openRouterMimeType.includes("quicktime")) openRouterMimeType = "video/mp4";
    if (!openRouterMimeType.startsWith("video/")) openRouterMimeType = "video/webm";

    console.log(`[OpenRouter] Sending to Gemini 2.0 Flash...`);

    let response;
    try {
        response = await axios.post(
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
                      url: `data:${openRouterMimeType};base64,${base64Data}`
                    }
                  },
                  {
                    type: "text",
                    text: "Transcribe the audio from this interview. Output ONLY the transcript."
                  }
                ]
              }
            ],
            temperature: 0.1
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "Http-Referer": "http://localhost:3000",
              "X-Title": "SmartRecruit AI"
            },
            timeout: 300000 
          }
        );
    } catch (e) {
        console.warn("[OpenRouter] Primary failed, trying Gemini 2.0 Flash Lite...");
        // Fallback to Lite version which often has different provider routing
        response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "google/gemini-2.0-flash-lite-001",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${openRouterMimeType};base64,${base64Data}`
                    }
                  },
                  {
                    type: "text",
                    text: "Transcribe this interview."
                  }
                ]
              }
            ],
            temperature: 0.1
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "Http-Referer": "http://localhost:3000",
              "X-Title": "SmartRecruit AI"
            },
            timeout: 300000
          }
        );
    }

    const text = response.data.choices[0].message.content;
    
    if (!text || text.trim().length < 5) {
        throw new Error("AI could not extract speech.");
    }

    console.log("[OpenRouter] Transcription successful.");
    return text;
  } catch (error) {
    console.error('OpenRouter transcription FINAL error:', error.response?.data || error.message);
    
    if (error.response?.status === 413) {
        throw new Error("File too large for AI.");
    }

    throw new Error(error.response?.data?.error?.message || error.message);
  }
};

module.exports = { transcribeAudio };
