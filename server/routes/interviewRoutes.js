const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getQuestions } = require('../controllers/questionController');
const { startAnalysis, getInterviewResults, getInterviewHistory } = require('../controllers/analyzeController');
const { handleChat } = require('../controllers/chatController');
const { uploadResume, getResumeStatus } = require('../controllers/resumeController');
const auth = require('../middleware/authMiddleware');

// Use memory storage — Render has an ephemeral filesystem, so disk-saved files
// disappear between restarts. Keeping files in memory avoids ENOENT errors.
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth middleware to all routes
router.use(auth);

router.get('/', getInterviewHistory);
router.post('/generate-questions', getQuestions);
router.post('/analyze', upload.single('video'), startAnalysis);
router.get('/results/:id', getInterviewResults);
router.post('/chat', handleChat);
router.post('/resume', upload.single('resume'), uploadResume);
router.get('/resume-status', getResumeStatus);

module.exports = router;
