const express = require('express');
const router = express.Router();
const { getSchedules, updateSchedule, toggleSchedule } = require('../controllers/SchedulerController');
const { protect, authorize } = require('../../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getSchedules);
router.put('/:id', updateSchedule);
router.patch('/:id/toggle', toggleSchedule);

module.exports = router;
