const { getDb } = require("../db/mongo");
const config = require("../config");

// Composant d'accès aux données NoSQL (MongoDB) : historique de recherches.
//
// Pourquoi du NoSQL ici ? Ce sont des données d'activité, sans relations
// complexes, écrites très souvent, qu'on veut voir disparaître automatiquement
// avec le temps. Un document par (utilisateur, ville) suffit, sans schéma figé :
//   { userId, city, searchedAt, count }
const COLLECTION = "search_history";

let indexesReady = null;

const collection = async () => {
  const db = await getDb();
  const col = db.collection(COLLECTION);
  if (!indexesReady) {
    indexesReady = ensureIndexes(col).catch((err) => {
      indexesReady = null;
      throw err;
    });
  }
  await indexesReady;
  return col;
};

const ensureIndexes = async (col) => {
  // Un seul document par couple (utilisateur, ville) + lecture rapide des
  // dernières recherches d'un utilisateur.
  await col.createIndex({ userId: 1, city: 1 }, { unique: true });
  await col.createIndex({ userId: 1, searchedAt: -1 });
  // Index TTL : MongoDB supprime lui-même les documents plus vieux que X jours
  // (conservation limitée des données personnelles, RGPD).
  if (config.historyTtlDays > 0) {
    await col.createIndex(
      { searchedAt: 1 },
      { expireAfterSeconds: Math.round(config.historyTtlDays * 86400), name: "ttl_searchedAt" }
    );
  }
};

// Enregistre une recherche. Si la ville existe déjà pour cet utilisateur, on
// met à jour la date et on incrémente le compteur (upsert) : pas de doublon.
const record = async (userId, city) => {
  const col = await collection();
  await col.updateOne(
    { userId, city },
    { $set: { searchedAt: new Date() }, $inc: { count: 1 } },
    { upsert: true }
  );
};

// Dernières recherches d'un utilisateur, de la plus récente à la plus ancienne.
const recent = async (userId, limit) => {
  const col = await collection();
  return col
    .find({ userId }, { projection: { _id: 0, city: 1, count: 1, searchedAt: 1 } })
    .sort({ searchedAt: -1 })
    .limit(limit)
    .toArray();
};

// Efface tout l'historique d'un utilisateur (droit à l'effacement, RGPD).
const clear = async (userId) => {
  const col = await collection();
  const { deletedCount } = await col.deleteMany({ userId });
  return deletedCount;
};

module.exports = { record, recent, clear };
