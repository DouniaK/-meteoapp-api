// Variables d'environnement des tests : base dédiée, jamais la vraie base.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/meteoapp_test";
process.env.JWT_SECRET = "secret-de-test";
process.env.BCRYPT_ROUNDS = "4"; // rapide en test
// Base NoSQL de test (MongoDB, ou serveur compatible), jamais la vraie base.
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017";
process.env.MONGODB_DB = "meteoapp_test";
// TTL désactivé par défaut en test : le serveur de test (FerretDB) ne gère pas
// les index d'expiration. Avec un vrai MongoDB : HISTORY_TTL_DAYS=90 npm test
if (process.env.HISTORY_TTL_DAYS === undefined) process.env.HISTORY_TTL_DAYS = "0";
