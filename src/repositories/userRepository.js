const pool = require("../db/pool");

// Couche d'accès aux données : seul endroit où l'on écrit du SQL sur users.
// Les valeurs passent toujours par des paramètres ($1, $2...) et jamais par
// concaténation : c'est la protection contre l'injection SQL.
const create = async ({ email, passwordHash }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at`,
    [email, passwordHash]
  );
  return rows[0];
};

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
};

module.exports = { create, findByEmail };
