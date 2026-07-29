const express = require('express');
const router = express.Router();
const { getSchedules, updateSchedule, toggleSchedule } = require('../controllers/SchedulerController');
const { protect } = require('../../middlewares/auth.middleware');

router.get('/', protect, getSchedules);
router.put('/:id', protect, updateSchedule);
router.patch('/:id/toggle', protect, toggleSchedule);

module.exports = router;
