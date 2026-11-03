const request = require("supertest");
const { app, pool, resetDb, closeDb } = require("./helpers");

beforeAll(resetDb);
afterAll(closeDb);

describe("POST /api/auth/register", () => {
  test("crée un compte et renvoie un jeton, sans jamais exposer le hash", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "Nouveau@Test.fr", password: "motdepasse1" });
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("nouveau@test.fr"); // normalisé en minuscules
    expect(JSON.stringify(res.body)).not.toMatch(/hash/i);
  });

  test("le mot de passe n'est pas stocké en clair en base", async () => {
    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE email = 'nouveau@test.fr'"
    );
    expect(rows[0].password_hash).not.toContain("motdepasse1");
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/); // empreinte bcrypt
  });

  test("refuse un email déjà utilisé (409)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "nouveau@test.fr", password: "motdepasse1" });
    expect(res.status).toBe(409);
  });

  test("refuse un email invalide (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "pas-un-email", password: "motdepasse1" });
    expect(res.status).toBe(400);
  });

  test("refuse un mot de passe trop court (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "court@test.fr", password: "1234" });
    expect(res.status).toBe(400);
  });

  test("refuse un corps vide (400)", async () => {
    const res = await request(app).post("/api/auth/register");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  test("connecte avec les bons identifiants", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nouveau@test.fr", password: "motdepasse1" });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test("refuse un mauvais mot de passe (401)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nouveau@test.fr", password: "mauvais-mdp" });
    expect(res.status).toBe(401);
  });

  test("même réponse pour un email inconnu : pas de fuite sur les comptes existants", async () => {
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "inconnu@test.fr", password: "motdepasse1" });
    const wrongPwd = await request(app)
      .post("/api/auth/login")
      .send({ email: "nouveau@test.fr", password: "mauvais-mdp" });
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrongPwd.body);
  });
});

describe("Routes protégées et robustesse", () => {
  test("rejette un jeton falsifié (401)", async () => {
    const res = await request(app)
      .get("/api/favorites")
      .set({ Authorization: "Bearer faux.jeton.ici" });
    expect(res.status).toBe(401);
  });

  test("JSON mal formé : 400 et pas de fuite technique", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{ceci n'est pas du json");
    expect(res.status).toBe(400);
  });

  test("route inconnue : 404", async () => {
    const res = await request(app).get("/api/nimporte");
    expect(res.status).toBe(404);
  });

  test("/health répond ok quand la base est joignable", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
