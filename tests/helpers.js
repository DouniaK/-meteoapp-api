const fs = require("fs");
const path = require("path");
const request = require("supertest");
const pool = require("../src/db/pool");
const app = require("../src/app");
const { getDb, closeMongo } = require("../src/db/mongo");

// Recrée la base de test à l'identique de la production (schema + seed).
const resetDb = async () => {
  for (const file of ["schema.sql", "seed.sql"]) {
    const sql = fs.readFileSync(path.join(__dirname, "..", "db", file), "utf8");
    await pool.query(sql);
  }
};

const registerUser = async (email = "user@test.fr", password = "motdepasse1") => {
  const res = await request(app).post("/api/auth/register").send({ email, password });
  return { token: res.body.token, user: res.body.user, res };
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const resetMongo = async () => {
  const db = await getDb();
  await db.collection("search_history").deleteMany({});
};

const closeDb = async () => {
  await pool.end();
  await closeMongo();
};

module.exports = { app, pool, resetDb, resetMongo, registerUser, authHeader, closeDb };
