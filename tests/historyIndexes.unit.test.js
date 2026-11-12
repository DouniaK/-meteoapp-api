// Test unitaire (sans serveur) : vérifie quels index le code demande à MongoDB.
// Le fonctionnement réel de l'expiration est assuré par MongoDB lui-même.
const makeFakeCollection = () => {
  const calls = [];
  return {
    calls,
    createIndex: async (keys, options) => {
      calls.push({ keys, options });
    },
  };
};

const loadRepository = (historyTtlDays, fakeCollection) => {
  let repo;
  jest.isolateModules(() => {
    jest.doMock("../src/config", () => ({ historyTtlDays, mongoUri: "mongodb://fake" }));
    jest.doMock("../src/db/mongo", () => ({
      getDb: async () => ({ collection: () => fakeCollection }),
    }));
    repo = require("../src/repositories/historyRepository");
  });
  return repo;
};

describe("historyRepository : index créés", () => {
  test("crée un index TTL de 30 jours quand historyTtlDays = 30", async () => {
    const col = makeFakeCollection();
    col.updateOne = async () => {};
    const repo = loadRepository(30, col);
    await repo.record(1, "Paris");
    const ttl = col.calls.find((c) => c.options && c.options.expireAfterSeconds);
    expect(ttl).toBeDefined();
    expect(ttl.keys).toEqual({ searchedAt: 1 });
    expect(ttl.options.expireAfterSeconds).toBe(30 * 86400);
  });

  test("ne crée aucun index TTL quand historyTtlDays = 0", async () => {
    const col = makeFakeCollection();
    col.updateOne = async () => {};
    const repo = loadRepository(0, col);
    await repo.record(1, "Paris");
    expect(col.calls.some((c) => c.options && c.options.expireAfterSeconds)).toBe(false);
  });

  test("crée toujours l'index unique (utilisateur, ville)", async () => {
    const col = makeFakeCollection();
    col.updateOne = async () => {};
    const repo = loadRepository(0, col);
    await repo.record(1, "Paris");
    const unique = col.calls.find((c) => c.options && c.options.unique);
    expect(unique.keys).toEqual({ userId: 1, city: 1 });
  });
});
