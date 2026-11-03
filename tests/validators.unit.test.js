const { isValidEmail, isValidPassword, cleanLabel } = require("../src/utils/validators");

describe("validators (tests unitaires)", () => {
  test.each(["a@b.fr", "dounia.k@estiam.com"])("email valide : %s", (e) => {
    expect(isValidEmail(e)).toBe(true);
  });

  test.each(["", "abc", "a@b", "a b@c.fr", null, undefined, 42])(
    "email invalide : %p",
    (e) => {
      expect(isValidEmail(e)).toBe(false);
    }
  );

  test("mot de passe : 8 caractères minimum", () => {
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
  });

  test("mot de passe : 72 caractères maximum (limite bcrypt)", () => {
    expect(isValidPassword("a".repeat(72))).toBe(true);
    expect(isValidPassword("a".repeat(73))).toBe(false);
  });

  test("cleanLabel retire les espaces autour", () => {
    expect(cleanLabel("  Drancy  ")).toBe("Drancy");
  });

  test.each([undefined, null, 5, "", "   ", "x".repeat(256)])(
    "cleanLabel rejette %p",
    (v) => {
      expect(() => cleanLabel(v)).toThrow();
    }
  );
});
