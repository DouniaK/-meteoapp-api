const request = require("supertest");
const { app, pool, resetDb, registerUser, authHeader, closeDb } = require("./helpers");

beforeAll(resetDb);
afterAll(closeDb);

describe("Favoris", () => {
  let alice;
  let bob;

  beforeAll(async () => {
    alice = await registerUser("alice@test.fr");
    bob = await registerUser("bob@test.fr");
  });

  test("401 sans jeton", async () => {
    const res = await request(app).get("/api/favorites");
    expect(res.status).toBe(401);
  });

  test("liste vide au départ", async () => {
    const res = await request(app).get("/api/favorites").set(authHeader(alice.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("ajoute un favori (201)", async () => {
    const res = await request(app)
      .post("/api/favorites")
      .set(authHeader(alice.token))
      .send({ label: "Drancy" });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe("Drancy");
  });

  test("refuse un doublon (409) : la règle est garantie par la base", async () => {
    const res = await request(app)
      .post("/api/favorites")
      .set(authHeader(alice.token))
      .send({ label: "Drancy" });
    expect(res.status).toBe(409);
  });

  test("refuse un libellé vide (400)", async () => {
    const res = await request(app)
      .post("/api/favorites")
      .set(authHeader(alice.token))
      .send({ label: "   " });
    expect(res.status).toBe(400);
  });

  test("deux utilisateurs partagent la même ville sans doublon en base", async () => {
    await request(app).post("/api/favorites").set(authHeader(bob.token)).send({ label: "Drancy" });
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM cities WHERE label = 'Drancy'");
    expect(rows[0].n).toBe(1);
  });

  test("chaque utilisateur ne voit que ses propres favoris", async () => {
    await request(app).post("/api/favorites").set(authHeader(bob.token)).send({ label: "Paris" });
    const a = await request(app).get("/api/favorites").set(authHeader(alice.token));
    const b = await request(app).get("/api/favorites").set(authHeader(bob.token));
    expect(a.body.map((c) => c.label)).toEqual(["Drancy"]);
    expect(b.body.map((c) => c.label).sort()).toEqual(["Drancy", "Paris"]);
  });

  test("supprime un favori (204) puis 404 si on recommence", async () => {
    const list = await request(app).get("/api/favorites").set(authHeader(alice.token));
    const id = list.body[0].id;
    const del = await request(app).delete(`/api/favorites/${id}`).set(authHeader(alice.token));
    expect(del.status).toBe(204);
    const again = await request(app).delete(`/api/favorites/${id}`).set(authHeader(alice.token));
    expect(again.status).toBe(404);
  });

  test("on ne peut pas supprimer le favori d'un autre utilisateur", async () => {
    const list = await request(app).get("/api/favorites").set(authHeader(bob.token));
    const id = list.body[0].id;
    const res = await request(app).delete(`/api/favorites/${id}`).set(authHeader(alice.token));
    expect(res.status).toBe(404);
    const still = await request(app).get("/api/favorites").set(authHeader(bob.token));
    expect(still.body.length).toBe(2);
  });

  test("identifiant invalide : 400", async () => {
    const res = await request(app).delete("/api/favorites/abc").set(authHeader(alice.token));
    expect(res.status).toBe(400);
  });

  test("injection SQL : la valeur est stockée telle quelle, les tables restent intactes", async () => {
    const evil = "'); DROP TABLE users; --";
    const res = await request(app)
      .post("/api/favorites")
      .set(authHeader(alice.token))
      .send({ label: evil });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe(evil);
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM users");
    expect(rows[0].n).toBe(2); // la table users existe toujours, avec ses 2 comptes
  });
});
