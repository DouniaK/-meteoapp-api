const request = require("supertest");
const { app, resetDb, resetMongo, registerUser, authHeader, closeDb } = require("./helpers");
const { getDb } = require("../src/db/mongo");

beforeAll(async () => {
  await resetDb();
  await resetMongo();
});
afterAll(closeDb);

describe("Historique de recherches (NoSQL / MongoDB)", () => {
  let alice;
  let bob;

  beforeAll(async () => {
    alice = await registerUser("alice-h@test.fr");
    bob = await registerUser("bob-h@test.fr");
  });

  test("401 sans jeton", async () => {
    expect((await request(app).get("/api/history")).status).toBe(401);
    expect((await request(app).post("/api/history").send({ city: "Paris" })).status).toBe(401);
  });

  test("historique vide au départ", async () => {
    const res = await request(app).get("/api/history").set(authHeader(alice.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("enregistre une recherche (201) puis la retrouve", async () => {
    const post = await request(app)
      .post("/api/history")
      .set(authHeader(alice.token))
      .send({ city: "Drancy" });
    expect(post.status).toBe(201);
    const res = await request(app).get("/api/history").set(authHeader(alice.token));
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ city: "Drancy", count: 1 });
  });

  test("même ville cherchée 2 fois : un seul document, compteur à 2", async () => {
    await request(app).post("/api/history").set(authHeader(alice.token)).send({ city: "Drancy" });
    const res = await request(app).get("/api/history").set(authHeader(alice.token));
    expect(res.body).toHaveLength(1);
    expect(res.body[0].count).toBe(2);
    const db = await getDb();
    expect(await db.collection("search_history").countDocuments({ userId: Number(alice.user.id) })).toBe(1);
  });

  test("tri : la recherche la plus récente d'abord, et limit respecté", async () => {
    for (const city of ["Paris", "Lyon", "Nice"]) {
      await request(app).post("/api/history").set(authHeader(alice.token)).send({ city });
      await new Promise((r) => setTimeout(r, 15));
    }
    const all = await request(app).get("/api/history").set(authHeader(alice.token));
    expect(all.body.map((h) => h.city)).toEqual(["Nice", "Lyon", "Paris", "Drancy"]);
    const two = await request(app).get("/api/history?limit=2").set(authHeader(alice.token));
    expect(two.body.map((h) => h.city)).toEqual(["Nice", "Lyon"]);
  });

  test("limit invalide : 400", async () => {
    for (const bad of ["0", "21", "abc", "2.5"]) {
      const res = await request(app).get(`/api/history?limit=${bad}`).set(authHeader(alice.token));
      expect(res.status).toBe(400);
    }
  });

  test("un utilisateur ne voit que son propre historique", async () => {
    await request(app).post("/api/history").set(authHeader(bob.token)).send({ city: "Marseille" });
    const b = await request(app).get("/api/history").set(authHeader(bob.token));
    expect(b.body.map((h) => h.city)).toEqual(["Marseille"]);
    const a = await request(app).get("/api/history").set(authHeader(alice.token));
    expect(a.body.map((h) => h.city)).not.toContain("Marseille");
  });

  test("ville vide ou absente : 400", async () => {
    for (const body of [{}, { city: "   " }, { city: "x".repeat(256) }]) {
      const res = await request(app).post("/api/history").set(authHeader(alice.token)).send(body);
      expect(res.status).toBe(400);
    }
  });

  test("injection NoSQL : un objet { $ne: null } à la place de la ville est refusé (400)", async () => {
    const res = await request(app)
      .post("/api/history")
      .set(authHeader(alice.token))
      .send({ city: { $ne: null } });
    expect(res.status).toBe(400);
    const db = await getDb();
    expect(await db.collection("search_history").countDocuments({ city: { $type: "object" } })).toBe(0);
  });

  test("DELETE efface seulement l'historique de l'utilisateur connecté (204)", async () => {
    const del = await request(app).delete("/api/history").set(authHeader(alice.token));
    expect(del.status).toBe(204);
    const a = await request(app).get("/api/history").set(authHeader(alice.token));
    expect(a.body).toEqual([]);
    const b = await request(app).get("/api/history").set(authHeader(bob.token));
    expect(b.body).toHaveLength(1);
  });

  test("/health indique l'état de la base NoSQL", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", nosql: "ok" });
  });
});
