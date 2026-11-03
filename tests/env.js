// Variables d'environnement des tests : base dédiée, jamais la vraie base.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/meteoapp_test";
process.env.JWT_SECRET = "secret-de-test";
process.env.BCRYPT_ROUNDS = "4"; // rapide en test
