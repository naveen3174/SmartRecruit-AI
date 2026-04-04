const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getQuestions } = require('../controllers/questionController');
const { startAnalysis, getInterviewResults, getInterviewHistory } = require('../controllers/analyzeController');
const { handleChat } = require('../controllers/chatController');
const { uploadResume, getResumeStatus } = require('../controllers/resumeController');
const auth = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext)
  }
});

const upload = multer({ storage: storage });

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
