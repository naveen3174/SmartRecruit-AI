# 🤖 SmartRecruit AI: Advanced Interview Intelligence

SmartRecruit AI is a cutting-edge platform designed to revolutionize the recruitment process through Artificial Intelligence. It provides real-time interview transcription, deep performance analysis, job-resume matching, and personalized AI coaching.

---

## 🚀 Key Features

### 1. 🎙️ AI Video Transcription
Powered by **Gemini 2.0 Flash** (via OpenRouter), the system transcribes interview recordings with high accuracy, capturing spoken words and nuances securely.

### 2. 📊 Performance Analytics
Detailed scoring across multiple dimensions:
- **Overall Competency**
- **Technical Depth**
- **Communication Clarity**
- **Confidence Level**
- **Job Match Score**

### 3. 📄 Synced AI Resume Profile
Upload your resume and the AI will analyze its contents to provide a **Job Match Score** against specific Job Descriptions. It identifies missing skills and top strengths.

### 4. 🧠 Question-Level Breakdown
The AI tracks which questions were answered and which were skipped, providing a brief summary of the candidate's response for each specific question.

### 5. 💬 SmartRecruit Bhai (AI Coach)
A direct-talking, expert AI mentor that you can chat with after the interview. 
- Ask for "Ideal Answers" to questions you missed.
- Receive specific tips to improve your technical depth.

### 6. 📉 Visual Insights & Exports
Beautiful, interactive charts powered by **Recharts** to visualize your performance. You can also generate **Full PDF Reports** summarizing your skills, strengths, and areas for improvement.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React 19, Vite
- **Styling & UI**: Tailwind CSS, Framer Motion (Animations), Lucide React (Icons)
- **Data Visualization**: Recharts
- **Video/Media**: React Webcam
- **Exporting**: jsPDF
- **Networking**: Axios

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Uploads**: Multer
- **A.I. Engine**: Google Gemini 2.0 via **OpenRouter API** (REST Integration via Axios)

---

## 📂 Project Structure

```text
├── client/                # React Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components (Charts, Layout)
│   │   ├── pages/         # Page components (Dashboard, InterviewRoom, Results)
│   │   ├── services/      # API integration layers
│   │   └── assets/        # Styles and static files
│   └── package.json       # Frontend dependencies
├── server/                # Node.js Express Backend
│   ├── controllers/       # Route handlers (Auth, Interview, Analysis, etc.)
│   ├── models/            # Mongoose Schemas (User, Interview, etc.)
│   ├── routes/            # API Endpoints
│   ├── services/          # AI logic (Whisper/Gemini, Analysis via OpenRouter)
│   ├── middleware/        # Authentication & Upload handlers
│   ├── uploads/           # Local storage for recordings & resumes
│   └── package.json       # Backend dependencies
└── README.md              # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js installed
- MongoDB account/URI
- OpenRouter API Key

### 2. Backend Setup
1. Navigate to the `server` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file with:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   OPENROUTER_API_KEY=your_openrouter_key
   ```
4. Start the server: `npm start` (or `npm run dev` if configured)

### 3. Frontend Setup
1. Navigate to the `client` directory.
2. Install dependencies: `npm install`
3. Start the Vite dev server: `npm run dev`

---

## 📱 Mobile Usage

To run on a mobile device:
1. Ensure your laptop and mobile are on the **same Wi-Fi**.
2. Run `npm run dev --host` in the `client` directory.
3. Open the **Network URL** shown in your terminal (e.g., `http://192.168.x.x:5173`) on your mobile browser.
4. *Note: Mobile browsers may require manual camera permissions for non-HTTPS local links.*

---

## 🛡️ Security & Privacy
- **JWT Auth**: Secure user sessions.
- **Data Safety**: All recordings are processed securely via OpenRouter.
- **Transparency**: AI-generated reports include "Verified Transcription" for human cross-checking.

---

Developed with ❤️ by the **SmartRecruit AI Team**.
