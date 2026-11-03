const request = require("supertest");
const { app, resetDb, registerUser, authHeader, closeDb } = require("./helpers");

beforeAll(resetDb);
afterAll(closeDb);

describe("Feedbacks", () => {
  let user;
  beforeAll(async () => {
    user = await registerUser("fb@test.fr");
  });

  test("liste les 9 conditions météo (public)", async () => {
    const res = await request(app).get("/api/feedbacks/conditions");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(9);
    expect(res.body[0]).toEqual({ code: "01d", label_fr: "Ensoleillé" });
  });

  test("401 si on envoie un feedback sans être connecté", async () => {
    const res = await request(app)
      .post("/api/feedbacks")
      .send({ city: "Drancy", conditionCode: "10d" });
    expect(res.status).toBe(401);
  });

  test("enregistre un feedback (201)", async () => {
    const res = await request(app)
      .post("/api/feedbacks")
      .set(authHeader(user.token))
      .send({ city: "Drancy", conditionCode: "10d" });
    expect(res.status).toBe(201);
    expect(res.body.city).toBe("Drancy");
  });

  test("refuse une condition inconnue (400)", async () => {
    const res = await request(app)
      .post("/api/feedbacks")
      .set(authHeader(user.token))
      .send({ city: "Drancy", conditionCode: "99x" });
    expect(res.status).toBe(400);
  });

  test("refuse une ville manquante (400)", async () => {
    const res = await request(app)
      .post("/api/feedbacks")
      .set(authHeader(user.token))
      .send({ conditionCode: "10d" });
    expect(res.status).toBe(400);
  });

  test("statistiques par ville (public)", async () => {
    await request(app)
      .post("/api/feedbacks")
      .set(authHeader(user.token))
      .send({ city: "Drancy", conditionCode: "10d" });
    await request(app)
      .post("/api/feedbacks")
      .set(authHeader(user.token))
      .send({ city: "Drancy", conditionCode: "01d" });
    const res = await request(app).get("/api/feedbacks/stats").query({ city: "Drancy" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { condition: "Pluie légère", nb_feedbacks: 2 },
      { condition: "Ensoleillé", nb_feedbacks: 1 },
    ]);
  });

  test("statistiques sans paramètre city : 400", async () => {
    const res = await request(app).get("/api/feedbacks/stats");
    expect(res.status).toBe(400);
  });
});
