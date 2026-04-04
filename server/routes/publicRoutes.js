const express = require('express');
const router = express.Router();
const { getGlobalStats, getPublicResults } = require('../controllers/publicController');

router.get('/stats', getGlobalStats);
router.get('/results/:id', getPublicResults);

module.exports = router;
