const { MongoClient } = require("mongodb");
const config = require("../config");
const HttpError = require("../utils/HttpError");

// Connexion MongoDB créée au premier besoin puis réutilisée (le pilote gère
// lui-même un pool de connexions).
let client = null;
let dbPromise = null;

const getDb = () => {
  if (!config.mongoUri) {
    return Promise.reject(new HttpError(503, "Base NoSQL non configurée."));
  }
  if (!dbPromise) {
    client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
    dbPromise = client
      .connect()
      .then((c) => c.db(config.mongoDbName))
      .catch((err) => {
        dbPromise = null; // permet de réessayer à la requête suivante
        throw err;
      });
  }
  return dbPromise;
};

const closeMongo = async () => {
  if (client) {
    await client.close();
  }
  client = null;
  dbPromise = null;
};

module.exports = { getDb, closeMongo };
