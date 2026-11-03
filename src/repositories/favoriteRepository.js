const pool = require("../db/pool");

const listByUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.label
     FROM favorites f
     JOIN cities c ON c.id = f.city_id
     WHERE f.user_id = $1
     ORDER BY f.created_at, c.id`,
    [userId]
  );
  return rows;
};

// Retourne true si le favori a été ajouté, false s'il existait déjà
// (la clé primaire composée empêche le doublon, ON CONFLICT l'ignore).
const add = async (userId, cityId) => {
  const { rowCount } = await pool.query(
    `INSERT INTO favorites (user_id, city_id) VALUES ($1, $2)
     ON CONFLICT (user_id, city_id) DO NOTHING`,
    [userId, cityId]
  );
  return rowCount === 1;
};

// Retourne true si un favori a bien été supprimé.
const remove = async (userId, cityId) => {
  const { rowCount } = await pool.query(
    `DELETE FROM favorites WHERE user_id = $1 AND city_id = $2`,
    [userId, cityId]
  );
  return rowCount === 1;
};

module.exports = { listByUser, add, remove };
