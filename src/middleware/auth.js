const jwt = require("jsonwebtoken");
const config = require("../config");
const HttpError = require("../utils/HttpError");

// Vérifie le jeton JWT envoyé dans l'en-tête "Authorization: Bearer <jeton>"
// et place l'identifiant de l'utilisateur dans req.user.
module.exports = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Authentification requise."));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    return next(new HttpError(401, "Jeton invalide ou expiré."));
  }
};
