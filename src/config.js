require("dotenv").config();

// Une variable obligatoire manquante doit faire échouer le démarrage
// immédiatement, plutôt que de produire un comportement imprévisible.
const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
};

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: required("DATABASE_URL"),
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  // Base NoSQL (MongoDB) : historique de recherches. Facultative : sans URI,
  // le reste de l'API fonctionne et les routes /api/history répondent 503.
  mongoUri: process.env.MONGODB_URI || null,
  mongoDbName: process.env.MONGODB_DB || "meteoapp",
  // Durée de conservation de l'historique (RGPD) ; 0 = pas d'expiration.
  historyTtlDays:
    process.env.HISTORY_TTL_DAYS !== undefined
      ? Number(process.env.HISTORY_TTL_DAYS)
      : 90,
};
