const HttpError = require("../utils/HttpError");

// Dernier maillon : transforme toute erreur en réponse JSON propre.
// Les erreurs inattendues sont journalisées côté serveur mais le détail
// n'est jamais renvoyé au client (pas de fuite d'informations internes).
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Corps de requête JSON invalide." });
  }
  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }
  return res.status(500).json({ error: "Erreur interne du serveur." });
};
