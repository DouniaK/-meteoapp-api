const express = require("express");
const auth = require("../middleware/auth");
const HttpError = require("../utils/HttpError");
const { cleanLabel } = require("../utils/validators");
const cityRepository = require("../repositories/cityRepository");
const favoriteRepository = require("../repositories/favoriteRepository");

const router = express.Router();
router.use(auth); // toutes les routes de favoris exigent d'être connecté

// GET /api/favorites -> [{ id, label }]
router.get("/", async (req, res, next) => {
  try {
    res.json(await favoriteRepository.listByUser(req.user.id));
  } catch (err) {
    next(err);
  }
});

// POST /api/favorites { label } -> 201 { id, label } | 409 si déjà favori
router.post("/", async (req, res, next) => {
  try {
    const label = cleanLabel((req.body || {}).label);
    const city = await cityRepository.findOrCreate(label);
    const added = await favoriteRepository.add(req.user.id, city.id);
    if (!added) {
      throw new HttpError(409, "Cette adresse est déjà dans vos favoris.");
    }
    res.status(201).json(city);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/favorites/:cityId -> 204 | 404
router.delete("/:cityId", async (req, res, next) => {
  try {
    const cityId = Number(req.params.cityId);
    if (!Number.isInteger(cityId) || cityId < 1) {
      throw new HttpError(400, "Identifiant de ville invalide.");
    }
    const removed = await favoriteRepository.remove(req.user.id, cityId);
    if (!removed) {
      throw new HttpError(404, "Favori introuvable.");
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
