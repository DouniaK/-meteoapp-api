const express = require("express");
const authService = require("../services/authService");

const router = express.Router();

// POST /api/auth/register  { email, password }  ->  201 { token, user }
router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    res.status(201).json(await authService.register(email, password));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  { email, password }  ->  200 { token, user }
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    res.json(await authService.login(email, password));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
