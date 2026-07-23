// src/api/routes/catalog.js
const express = require('express');
const router = express.Router();
const { getProducts, getCategories } = require('../controllers/catalogController');
const { protect } = require('../../middlewares/auth.middleware');

router.get('/products',   protect, getProducts);
router.get('/categories', protect, getCategories);

module.exports = router;
