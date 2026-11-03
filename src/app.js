const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pool = require("./db/pool");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const favoritesRoutes = require("./routes/favorites");
const feedbacksRoutes = require("./routes/feedbacks");

const app = express();

// Derrière le proxy de l'hébergeur (Render...), l'adresse IP réelle du client
// est dans X-Forwarded-For : sans cette ligne, tous les utilisateurs partageraient
// la même limite anti force brute.
app.set("trust proxy", 1);

app.use(helmet()); // en-têtes HTTP de sécurité
app.use(cors());
app.use(express.json({ limit: "10kb" })); // limite la taille des requêtes

// Anti force brute sur la connexion : 30 essais / 15 min / adresse IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, réessayez plus tard." },
  skip: () => process.env.NODE_ENV === "test",
});

// Sonde de santé (utilisée par l'hébergeur / Docker) : vérifie aussi la base.
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    res.status(503).json({ status: "database unavailable" });
  }
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/feedbacks", feedbacksRoutes);

app.use((req, res) => res.status(404).json({ error: "Route introuvable." }));
app.use(errorHandler);

module.exports = app;
