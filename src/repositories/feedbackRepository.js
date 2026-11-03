const pool = require("../db/pool");

const listConditions = async () => {
  const { rows } = await pool.query(
    `SELECT code, label_fr FROM weather_conditions ORDER BY code`
  );
  return rows;
};

const conditionExists = async (code) => {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM weather_conditions WHERE code = $1`,
    [code]
  );
  return rowCount === 1;
};

const create = async ({ userId, cityId, conditionCode }) => {
  const { rows } = await pool.query(
    `INSERT INTO feedbacks (user_id, city_id, condition_code)
     VALUES ($1, $2, $3)
     RETURNING id, created_at`,
    [userId, cityId, conditionCode]
  );
  return rows[0];
};

// Statistiques d'une ville, via la vue v_feedback_stats.
const statsByCity = async (cityLabel) => {
  const { rows } = await pool.query(
    `SELECT condition, nb_feedbacks::int AS nb_feedbacks
     FROM v_feedback_stats
     WHERE city = $1
     ORDER BY nb_feedbacks DESC, condition`,
    [cityLabel]
  );
  return rows;
};

module.exports = { listConditions, conditionExists, create, statsByCity };
