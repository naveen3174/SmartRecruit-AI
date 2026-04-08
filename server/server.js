const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Allow Vercel frontend + localhost in dev
// CLIENT_URL can be a single URL or comma-separated list of URLs
const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : []),
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

// Also allow all Vercel preview deployment subdomains
const vercelPreviewRegex = /^https:\/\/.*\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow all *.vercel.app subdomains (covers preview deployments)
    if (vercelPreviewRegex.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection (Re-enabling for final implementation)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartrecruit')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('SmartRecruit AI API is running...');
});

// Import and use routes
const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const publicRoutes = require('./routes/publicRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/public', publicRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
