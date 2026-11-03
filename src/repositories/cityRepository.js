const pool = require("../db/pool");

// Retourne la ville existante ou la crée : une même ville n'est stockée
// qu'une seule fois (contrainte UNIQUE sur label), même si 100 utilisateurs
// l'ajoutent en favori.
const findOrCreate = async (label) => {
  const { rows } = await pool.query(
    `INSERT INTO cities (label) VALUES ($1)
     ON CONFLICT (label) DO UPDATE SET label = EXCLUDED.label
     RETURNING id, label`,
    [label]
  );
  return rows[0];
};

const findByLabel = async (label) => {
  const { rows } = await pool.query(
    `SELECT id, label FROM cities WHERE label = $1`,
    [label]
  );
  return rows[0] || null;
};

module.exports = { findOrCreate, findByLabel };
