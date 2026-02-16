# 📚 FlashJuris API - Documentation

**Version** : 1.0.0
**Base URL** : `/api`

---

## 🏥 Health Check

### GET `/api/health`

Vérifie l'état de l'application et de la base de données.

**Réponse**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-13T22:40:00.000Z",
  "uptime": 12345,
  "environment": "production",
  "checks": {
    "database": "ok"
  }
}
```

---

## 🃏 Flashcards

### POST `/api/flashcards`

Créer une nouvelle flashcard.

**Body**:
```json
{
  "question": "Qu'est-ce que l'article 1103 du Code civil ?",
  "answer": "Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits",
  "explanation": "Principe de force obligatoire du contrat",
  "category": "DROIT_CIVIL",
  "subCategory": "Contrats",
  "difficulty": "MEDIUM",
  "tags": ["contrat", "obligations"],
  "legalReference": "Code civil",
  "articleNumber": "Article 1103",
  "isPublic": false
}
```

**Réponse** (201):
```json
{
  "success": true,
  "data": { ...flashcard },
  "message": "Flashcard créée avec succès"
}
```

### GET `/api/flashcards`

Liste les flashcards (avec filtres et pagination).

**Query params**:
- `page` (number): Page actuelle (défaut: 1)
- `limit` (number): Nombre par page (défaut: 20)
- `category` (string): Filtrer par catégorie
- `difficulty` (string): Filtrer par difficulté
- `archived` (boolean): Inclure archivées
- `search` (string): Recherche full-text

**Réponse** (200):
```json
{
  "success": true,
  "data": [...flashcards],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET `/api/flashcards/[id]`

Récupère une flashcard par ID.

**Réponse** (200):
```json
{
  "success": true,
  "data": { ...flashcard }
}
```

### PATCH `/api/flashcards/[id]`

Met à jour une flashcard.

**Body** (tous les champs optionnels):
```json
{
  "question": "Nouvelle question",
  "answer": "Nouvelle réponse",
  "isArchived": true
}
```

**Réponse** (200):
```json
{
  "success": true,
  "data": { ...flashcard },
  "message": "Flashcard mise à jour avec succès"
}
```

### DELETE `/api/flashcards/[id]`

Supprime une flashcard.

**Réponse** (200):
```json
{
  "success": true,
  "message": "Flashcard supprimée avec succès"
}
```

---

## 📖 Study Sessions

### POST `/api/study-sessions`

Démarre une nouvelle session d'étude.

**Body**:
```json
{
  "category": "DROIT_CIVIL",
  "difficulty": "MEDIUM",
  "dueOnly": true,
  "limit": 20
}
```

**Réponse** (201):
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-123",
      "startedAt": "2026-02-13T22:40:00.000Z"
    },
    "flashcards": [
      { "id": "card-1" },
      { "id": "card-2" }
    ]
  },
  "message": "Session créée avec succès"
}
```

### GET `/api/study-sessions`

Liste les sessions d'étude.

**Query params**:
- `page` (number)
- `limit` (number)

**Réponse** (200):
```json
{
  "success": true,
  "data": [...sessions],
  "pagination": { ... }
}
```

### POST `/api/study-sessions/[id]/answer`

Enregistre une réponse pour une flashcard.

**Body**:
```json
{
  "flashcardId": "card-123",
  "wasCorrect": true,
  "responseTime": 8500,
  "confidence": 4
}
```

**Réponse** (200):
```json
{
  "success": true,
  "data": { ...answer },
  "message": "Réponse enregistrée"
}
```

**Algorithme de répétition espacée (SM-2)** :
- Réponse correcte → intervalle multiplié par easeFactor, easeFactor +0.1
- Réponse incorrecte → intervalle = 1 jour, easeFactor -0.2
- nextReviewDate calculée automatiquement

### POST `/api/study-sessions/[id]/complete`

Termine une session d'étude.

**Réponse** (200):
```json
{
  "success": true,
  "data": {
    "id": "session-123",
    "startedAt": "...",
    "endedAt": "...",
    "duration": 1200,
    "cardsStudied": 20,
    "cardsCorrect": 18,
    "cardsIncorrect": 2,
    "averageTime": 60,
    "score": 90
  },
  "message": "Session terminée avec succès"
}
```

---

## 🔒 Sécurité

### Rate Limiting

Toutes les routes sont protégées par rate limiting :
- **Modéré** : 30 requêtes / minute (routes publiques)
- **Strict** : 5 requêtes / minute (auth, actions sensibles)

Headers de réponse :
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1676328000
```

### Authentication

🚧 **À implémenter** : Les routes nécessitent une authentification JWT.
Actuellement, `userId = "temp-user-id"` est utilisé temporairement.

---

## 📊 Format des réponses

### Succès
```json
{
  "success": true,
  "data": { ... },
  "message": "Message optionnel"
}
```

### Erreur
```json
{
  "success": false,
  "error": "Message d'erreur",
  "details": { ... }
}
```

### Pagination
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 🏷️ Enums

### FlashcardCategory
- `DROIT_CIVIL`
- `DROIT_PENAL`
- `DROIT_ADMINISTRATIF`
- `DROIT_CONSTITUTIONNEL`
- `DROIT_COMMERCIAL`
- `DROIT_TRAVAIL`
- `DROIT_FAMILLE`
- `DROIT_INTERNATIONAL`
- `PROCEDURE_CIVILE`
- `PROCEDURE_PENALE`
- `AUTRES`

### DifficultyLevel
- `EASY` (Facile)
- `MEDIUM` (Moyen)
- `HARD` (Difficile)
- `EXPERT` (Expert)

---

## 🛠️ Technologies

- **Runtime** : Next.js 14 (App Router)
- **Base de données** : PostgreSQL + Prisma ORM
- **Validation** : Zod
- **Logging** : Logger structuré JSON
- **Rate Limiting** : In-memory (production: Redis recommandé)
- **Deployment** : Render.com

---

## 📝 Notes

- ✅ Rate limiting appliqué
- ✅ Validation Zod sur toutes les entrées
- ✅ Logging structuré
- ✅ Gestion d'erreurs cohérente
- 🚧 Authentication à implémenter
- 🚧 Tests unitaires à ajouter
