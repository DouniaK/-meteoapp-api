const { Pool } = require("pg");
const config = require("../config");

// Un pool de connexions réutilisées : on ne rouvre pas une connexion
// à chaque requête HTTP.
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  // Les bases gratuites hébergées (Neon...) se mettent en veille et coupent
  // les connexions inactives : on ferme nous-mêmes les connexions au repos
  // rapidement, et on laisse le temps à la base de se réveiller.
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
});

// Sans ce gestionnaire, une connexion coupée par la base ferait planter
// tout le serveur Node. On journalise et on continue : le pool en rouvrira une.
pool.on("error", (err) => {
  console.error("Connexion inactive perdue (le pool se reconnectera) :", err.message);
});

module.exports = pool;
