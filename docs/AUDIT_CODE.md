# 🔍 AUDIT DU CODE - FlashJuris

**Date** : 2026-02-13
**Statut** : ❌ INCOHÉRENCE MAJEURE DÉTECTÉE

---

## ⚠️ PROBLÈME CRITIQUE

### 🔴 Incompatibilité Schema ↔ Routes API

**Le schéma Prisma a été remplacé par FlashJuris mais les routes API font toujours référence à l'ancien projet divorce saas**

#### Schéma actuel (PostgreSQL - FlashJuris)
```prisma
✅ User (utilisateurs)
✅ Flashcard (cartes de révision)
✅ StudySession (sessions d'étude)
✅ StudySessionCard (résultats par carte)
```

#### Routes API existantes (incompatibles)
```typescript
❌ src/app/api/dossiers/route.ts → prisma.dossier (n'existe plus)
❌ src/app/api/avocat/[slug]/route.ts → prisma.avocat (n'existe plus)
❌ src/app/api/documents/route.ts → prisma.document (n'existe plus)
❌ src/app/api/cron/purge/route.ts → prisma.dossier (n'existe plus)
❌ src/app/api/webhook/n8n/route.ts → ancien schéma
```

#### Types existants (incompatibles)
```typescript
❌ src/types/dossier.ts → ancien schéma
❌ src/types/avocat.ts → ancien schéma
❌ src/types/client.ts → ancien schéma
❌ src/types/document.ts → ancien schéma
```

---

## 📋 PLAN DE CORRECTION

### Phase 1 : Suppression du code incompatible ✅
- [ ] Supprimer anciennes routes API (dossiers, avocat, documents, etc.)
- [ ] Supprimer anciens types (dossier, avocat, client, document)
- [ ] Supprimer composants forms liés au divorce

### Phase 2 : Création des nouvelles routes FlashJuris
- [ ] POST /api/flashcards → Créer flashcard
- [ ] GET /api/flashcards → Liste flashcards
- [ ] GET /api/flashcards/[id] → Détail flashcard
- [ ] PATCH /api/flashcards/[id] → Modifier flashcard
- [ ] DELETE /api/flashcards/[id] → Supprimer flashcard
- [ ] POST /api/study-sessions → Démarrer session
- [ ] PATCH /api/study-sessions/[id] → Enregistrer réponse
- [ ] GET /api/study-sessions/[id]/stats → Statistiques
- [ ] POST /api/auth/register → Inscription
- [ ] POST /api/auth/login → Connexion

### Phase 3 : Création des nouveaux types
- [ ] src/types/flashcard.ts
- [ ] src/types/study-session.ts
- [ ] src/types/user.ts
- [ ] src/types/api.ts (réponses API standardisées)

### Phase 4 : Modernisation du code
- [ ] Utiliser logger.ts au lieu de console.log
- [ ] Ajouter rate limiting sur routes sensibles
- [ ] Ajouter validation Zod sur toutes les routes
- [ ] Utiliser try/catch avec formatErrorResponse
- [ ] Optimiser les requêtes Prisma

---

## 🛠️ FICHIERS À CRÉER

### Routes API
```
src/app/api/
  ├── flashcards/
  │   ├── route.ts (POST, GET)
  │   └── [id]/
  │       ├── route.ts (GET, PATCH, DELETE)
  │       └── review/route.ts (POST - marquer comme révisée)
  ├── study-sessions/
  │   ├── route.ts (POST - créer session)
  │   └── [id]/
  │       ├── route.ts (GET - détails)
  │       ├── answer/route.ts (POST - enregistrer réponse)
  │       └── complete/route.ts (POST - terminer session)
  └── auth/
      ├── register/route.ts
      ├── login/route.ts
      └── logout/route.ts
```

### Types
```
src/types/
  ├── flashcard.ts
  ├── study-session.ts
  ├── user.ts
  ├── api.ts (ApiResponse, ApiError, PaginatedResponse)
  └── index.ts (ré-exports)
```

---

## 📊 STATISTIQUES

- **Fichiers incompatibles** : 10+ routes + 5+ types
- **Fichiers à créer** : ~15 nouveaux fichiers
- **Estimation temps** : 2-3 heures de refactoring

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Créer fichier d'audit
2. ⏳ Supprimer code incompatible
3. ⏳ Créer nouvelles routes FlashJuris
4. ⏳ Tester toutes les routes
5. ⏳ Push vers GitHub
