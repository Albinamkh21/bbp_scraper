const express = require('express');
const router = express.Router();
const AuthService = require('../../services/AuthService');

router.post('/register', async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = await AuthService.login(req.body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;