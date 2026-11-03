const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const HttpError = require("../utils/HttpError");
const { isValidEmail, isValidPassword } = require("../utils/validators");
const userRepository = require("../repositories/userRepository");

// Hash factice : permet de faire le même travail de comparaison quand
// l'email n'existe pas, pour ne pas révéler par le temps de réponse
// quels emails sont inscrits.
const DUMMY_HASH = bcrypt.hashSync("mot-de-passe-factice", config.bcryptRounds);

const signToken = (user) =>
  jwt.sign({ sub: user.id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

const publicUser = (user) => ({ id: user.id, email: user.email });

const register = async (rawEmail, password) => {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    throw new HttpError(400, "Adresse email invalide.");
  }
  if (!isValidPassword(password)) {
    throw new HttpError(400, "Le mot de passe doit contenir entre 8 et 72 caractères.");
  }
  if (await userRepository.findByEmail(email)) {
    throw new HttpError(409, "Un compte existe déjà avec cet email.");
  }
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const user = await userRepository.create({ email, passwordHash });
  return { token: signToken(user), user: publicUser(user) };
};

const login = async (rawEmail, password) => {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const user = isValidEmail(email) ? await userRepository.findByEmail(email) : null;
  const hash = user ? user.password_hash : DUMMY_HASH;
  const ok = typeof password === "string" && (await bcrypt.compare(password, hash));
  // Même message que l'email soit inconnu ou le mot de passe faux.
  if (!user || !ok) {
    throw new HttpError(401, "Email ou mot de passe incorrect.");
  }
  return { token: signToken(user), user: publicUser(user) };
};

module.exports = { register, login };
