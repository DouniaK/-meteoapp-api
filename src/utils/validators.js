const HttpError = require("./HttpError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isValidEmail = (email) =>
  typeof email === "string" && email.length <= 255 && EMAIL_REGEX.test(email);

// 8 caractères minimum, 72 maximum (limite de bcrypt).
const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8 && password.length <= 72;

const cleanLabel = (label) => {
  if (typeof label !== "string") {
    throw new HttpError(400, "Le libellé de la ville est obligatoire.");
  }
  const trimmed = label.trim();
  if (trimmed.length === 0 || trimmed.length > 255) {
    throw new HttpError(400, "Le libellé doit contenir entre 1 et 255 caractères.");
  }
  return trimmed;
};

module.exports = { isValidEmail, isValidPassword, cleanLabel };
