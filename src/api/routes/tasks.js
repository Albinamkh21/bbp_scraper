const express = require('express');
const router = express.Router();
const { createTask } = require('../controllers/taskController');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/', protect, createTask);

module.exports = router;