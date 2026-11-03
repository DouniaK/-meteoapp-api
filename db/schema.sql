-- =====================================================================
-- MeteoAPP — schéma relationnel (PostgreSQL)
-- Modèle en 3FN : voir docs/conception-bdd.md (MCD / MLD / choix)
-- =====================================================================

DROP VIEW  IF EXISTS v_feedback_stats;
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS weather_conditions;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS users;

-- Comptes utilisateurs : le mot de passe n'est JAMAIS stocké en clair,
-- uniquement son empreinte (hash bcrypt) calculée côté API.
CREATE TABLE users (
    id            SERIAL       PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Villes / adresses issues de l'API adresse.gouv.fr (libellé unique).
CREATE TABLE cities (
    id    SERIAL       PRIMARY KEY,
    label VARCHAR(255) NOT NULL UNIQUE
);

-- Table de référence : les 9 conditions météo proposées à l'écran Feedback.
-- Le code correspond au code d'icône OpenWeatherMap (01d, 02d, ...).
CREATE TABLE weather_conditions (
    code     VARCHAR(3)  PRIMARY KEY,
    label_fr VARCHAR(60) NOT NULL UNIQUE
);

-- Association N-N entre utilisateurs et villes.
-- La clé primaire composée interdit les doublons au niveau de la base
-- (équivalent robuste de alreadyInFav() côté appli).
CREATE TABLE favorites (
    user_id    INTEGER     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    city_id    INTEGER     NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, city_id)
);

-- Retours des utilisateurs : condition météo réellement observée.
-- user_id devient NULL si le compte est supprimé (RGPD : la donnée
-- personnelle disparaît, la statistique anonyme reste).
CREATE TABLE feedbacks (
    id             SERIAL      PRIMARY KEY,
    user_id        INTEGER     REFERENCES users(id) ON DELETE SET NULL,
    city_id        INTEGER     NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    condition_code VARCHAR(3)  NOT NULL REFERENCES weather_conditions(code),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedbacks_city_created ON feedbacks (city_id, created_at DESC);
CREATE INDEX idx_favorites_user         ON favorites (user_id);

-- Vue : nombre de retours par ville et par condition (statistiques).
CREATE VIEW v_feedback_stats AS
SELECT c.label        AS city,
       wc.label_fr    AS condition,
       COUNT(*)       AS nb_feedbacks
FROM feedbacks f
JOIN cities c             ON c.id   = f.city_id
JOIN weather_conditions wc ON wc.code = f.condition_code
GROUP BY c.label, wc.label_fr;
