const express = require("express");
const auth = require("../middleware/auth");
const HttpError = require("../utils/HttpError");
const { cleanLabel } = require("../utils/validators");
const historyRepository = require("../repositories/historyRepository");

const router = express.Router();
router.use(auth);

// POST /api/history { city } -> 201
// cleanLabel refuse tout ce qui n'est pas une chaîne de caractères : un objet
// du type { "$ne": null } (injection NoSQL) est rejeté en 400.
router.post("/", async (req, res, next) => {
  try {
    const city = cleanLabel((req.body || {}).city);
    await historyRepository.record(req.user.id, city);
    res.status(201).json({ city });
  } catch (err) {
    next(err);
  }
});

// GET /api/history?limit=5 -> [{ city, count, searchedAt }]
router.get("/", async (req, res, next) => {
  try {
    let limit = 5;
    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
        throw new HttpError(400, "limit doit être un entier entre 1 et 20.");
      }
    }
    res.json(await historyRepository.recent(req.user.id, limit));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/history -> 204 (efface tout l'historique de l'utilisateur)
router.delete("/", async (req, res, next) => {
  try {
    await historyRepository.clear(req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
