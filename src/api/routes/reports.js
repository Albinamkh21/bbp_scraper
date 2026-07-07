// src/api/routes/reports.js
const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/ReportController');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/', protect, generateReport);

module.exports = router;
