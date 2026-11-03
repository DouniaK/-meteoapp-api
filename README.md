# API MeteoAPP

API REST (Node.js / Express / PostgreSQL) : comptes utilisateurs, favoris, feedbacks météo.

## Architecture en couches

```
Routes (HTTP)  ->  Services (règles métier)  ->  Repositories (SQL)  ->  PostgreSQL
 src/routes        src/services                   src/repositories
        \__ middleware : auth (JWT), errorHandler, rate limit, helmet __/
```

- **Routes** : reçoivent la requête HTTP, appellent la couche suivante, renvoient du JSON.
- **Services** : règles métier (validation, hash du mot de passe, création du jeton).
- **Repositories** : seul endroit qui contient du SQL, toujours paramétré (anti injection SQL).

## Endpoints

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | /api/auth/register | public | Créer un compte -> 201 `{ token, user }` |
| POST | /api/auth/login | public | Se connecter -> 200 `{ token, user }` |
| GET | /api/favorites | connecté | Lister mes favoris |
| POST | /api/favorites `{ label }` | connecté | Ajouter un favori (409 si doublon) |
| DELETE | /api/favorites/:cityId | connecté | Supprimer un favori (404 si absent) |
| GET | /api/feedbacks/conditions | public | Les 9 conditions météo |
| POST | /api/feedbacks `{ city, conditionCode }` | connecté | Envoyer un retour |
| GET | /api/feedbacks/stats?city=... | public | Statistiques d'une ville |
| GET | /health | public | Sonde de santé (teste aussi la base) |

Authentification : en-tête `Authorization: Bearer <jeton>`.

## Sécurité mise en place

- Mots de passe hachés avec **bcrypt** (jamais stockés ni renvoyés en clair).
- Authentification par **jeton JWT** signé, durée de vie limitée (7 jours).
- Requêtes SQL **paramétrées** (protection contre l'injection SQL, testée).
- Message d'erreur identique pour « email inconnu » et « mauvais mot de passe ».
- **helmet** (en-têtes de sécurité), **limitation de débit** sur la connexion (anti force brute),
  taille des requêtes limitée, détails d'erreurs internes jamais renvoyés au client.
- Secrets (`JWT_SECRET`, `DATABASE_URL`) uniquement dans des variables d'environnement.

## Lancer en local

```bash
cd backend
npm install
cp .env.example .env        # puis renseigner DATABASE_URL et JWT_SECRET
npm run db:init             # crée les tables + données de référence
npm start                   # API sur http://localhost:3000
```

## Tests

```bash
createdb meteoapp_test      # base dédiée aux tests
npm test                    # 49 tests (unitaires + intégration sur vraie base)
```

Variable optionnelle : `TEST_DATABASE_URL` pour pointer une autre base de test.
