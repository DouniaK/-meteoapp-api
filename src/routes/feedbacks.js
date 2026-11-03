const express = require("express");
const auth = require("../middleware/auth");
const HttpError = require("../utils/HttpError");
const { cleanLabel } = require("../utils/validators");
const cityRepository = require("../repositories/cityRepository");
const feedbackRepository = require("../repositories/feedbackRepository");

const router = express.Router();

// GET /api/feedbacks/conditions -> [{ code, label_fr }]  (public)
router.get("/conditions", async (req, res, next) => {
  try {
    res.json(await feedbackRepository.listConditions());
  } catch (err) {
    next(err);
  }
});

// GET /api/feedbacks/stats?city=Drancy -> [{ condition, nb_feedbacks }]  (public)
router.get("/stats", async (req, res, next) => {
  try {
    const city = cleanLabel(req.query.city);
    res.json(await feedbackRepository.statsByCity(city));
  } catch (err) {
    next(err);
  }
});

// POST /api/feedbacks { city, conditionCode } -> 201   (connecté)
router.post("/", auth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const label = cleanLabel(body.city);
    if (!(await feedbackRepository.conditionExists(body.conditionCode))) {
      throw new HttpError(400, "Condition météo inconnue.");
    }
    const city = await cityRepository.findOrCreate(label);
    const feedback = await feedbackRepository.create({
      userId: req.user.id,
      cityId: city.id,
      conditionCode: body.conditionCode,
    });
    res.status(201).json({ id: feedback.id, city: city.label });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
