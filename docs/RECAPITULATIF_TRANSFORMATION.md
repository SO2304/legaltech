# 🚀 RÉCAPITULATIF - TRANSFORMATION LEGALTECH DIVORCE

## ✅ Modifications effectuées

### 1. Intégration des clés API (.env.local)
- ✅ **Stripe**: `sk_live_51PAcur...` (clé live configurée)
- ✅ **Resend**: `re_7dfNr1yU...` (service d'emailing)
- ✅ **IPStack**: `9f3eec89...` (géolocalisation IP)
- ✅ **Supabase**: Toutes les clés configurées (URL, ANON_KEY, SERVICE_ROLE_KEY)
- ⚠️ **Claude API**: À compléter (extraire depuis curl command)
- ⚠️ **Database Password**: À obtenir depuis Supabase Dashboard

### 2. Dépendances installées
```bash
✅ @anthropic-ai/sdk       # Pour RAG avec Claude
✅ stripe                  # Paiement 149€ TTC
✅ @supabase/supabase-js  # Storage documents
✅ react-dropzone          # Upload documents
✅ jszip                   # Export ZIP
```

### 3. Schema Prisma transformé
✅ **Nouveau schema pour divorce (prisma/schema.prisma)**:
- ✅ Model `Avocat` (multi-juridiction, Stripe Connect)
- ✅ Model `Client` (détection pays via IP)
- ✅ Model `Dossier` (workflow complet + paiement + purge RGPD)
- ✅ Model `Document` (OCR + validation RAG)
- ✅ Model `TexteLoi` (base RAG critique)
- ✅ Enums: `Pays`, `DossierStatus`, `DocumentType`, `CodeLegal`

---

## ⚠️ ACTIONS REQUISES AVANT PUSH

### 1. Base de données
```bash
# À exécuter AVANT le push pour éviter les erreurs de build:
cd /workspace
npx prisma generate
npx prisma db push  # Ou prisma migrate dev --name init-divorce
```

### 2. Clés manquantes à compléter
Dans `.env.local`:
- `ANTHROPIC_API_KEY`: Extraire depuis le curl command fourni
- `DATABASE_URL`: Remplacer `YOUR_DB_PASSWORD` par le mot de passe Supabase
- `DIRECT_URL`: Remplacer `YOUR_DB_PASSWORD`
- `NEXTAUTH_SECRET`: Générer avec `openssl rand -base64 32`
- `CRON_SECRET`: Générer avec `openssl rand -base64 32`
- `STRIPE_WEBHOOK_SECRET`: Obtenir depuis Stripe Dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Obtenir depuis Stripe Dashboard

### 3. Seed de la base de données
Le fichier `prisma/seed.ts` doit être mis à jour pour charger les textes de lois français.

**Ancien code** (incompatible avec nouveau schema):
```typescript
// Références à des champs inexistants: slug, adresse, etc.
```

**Nouveau code requis**:
```typescript
// Seed avec textes de lois (Art. 229, 230, 1387, etc.)
// + Avocat de démo avec nouveau schema
```

---

## 📋 PLAN DE DÉVELOPPEMENT (5 PHASES)

### ✅ PHASE 1 : FONDATIONS & RAG (PARTIELLEMENT FAIT)
- ✅ Schema Prisma avec 5 tables
- ✅ Clés API intégrées
- ✅ Dépendances installées
- ⚠️ Service RAG à créer (`src/lib/rag-service.ts` existe mais utilise ZAI au lieu d'Anthropic)
- ❌ API `/api/rag/query` à créer
- ❌ Service géolocalisation à créer
- ❌ API `/api/geolocation` à créer
- ❌ Seed textes de lois à charger

### ❌ PHASE 2 : SMART INTAKE & OCR
- Service OCR avec Claude Vision
- API `/api/upload` avec validation RAG
- Supabase Storage bucket `documents`
- Page intake avec drag & drop
- Smart sourcing (liens portails gouvernementaux)

### ❌ PHASE 3 : PAIEMENT STRIPE
- API `/api/payment/create`
- API `/api/webhook/stripe`
- Page paiement avec Stripe Elements
- Webhook configuré (149€ TTC, dont 30€ frais)

### ❌ PHASE 4 : DASHBOARD AVOCAT
- API `/api/analyse/dossier`
- Dashboard liste dossiers
- Split-view avec source-mapping
- Export ZIP
- Validation avocat

### ❌ PHASE 5 : PURGE RGPD
- API `/api/cron/purge`
- Cron job J+7 sur Render
- Suppression fichiers Supabase
- Anonymisation données

---

## 🔥 PROBLÈME CRITIQUE

### Code actuel mélange 2 projets incompatibles:

1. **FlashJuris** (ancien - cartes de révision juridique)
   - API routes dans `/api/flashcards`, `/api/study-sessions`
   - Types dans `src/types/flashcard.ts`, etc.
   - Service RAG utilisant ZAI/GLM 5

2. **LegalTech Divorce** (nouveau - analyse dossiers divorce)
   - Nouveau schema Prisma (Avocat, Client, Dossier, Document, TexteLoi)
   - Doit utiliser Anthropic Claude pour RAG
   - Stripe, OCR, géolocalisation, purge RGPD

### Recommandation:
Supprimer TOUS les fichiers FlashJuris avant de continuer:
```bash
rm -rf src/app/api/flashcards
rm -rf src/app/api/study-sessions
rm -rf src/types/flashcard.ts
rm -rf src/types/study-session.ts
# etc.
```

Ou créer une branche `divorce-platform` et repartir proprement.

---

## 🎯 PROCHAINES ÉTAPES IMMÉDIATES

1. **Compléter les clés API** dans `.env.local`
2. **Générer le client Prisma**: `npx prisma generate`
3. **Créer la base de données**: `npx prisma db push`
4. **Seed les textes de lois**: Corriger `prisma/seed.ts` puis `npx tsx prisma/seed.ts`
5. **Créer les services Phase 1**:
   - `src/lib/rag-service.ts` (Anthropic)
   - `src/lib/geolocation-service.ts`
6. **Créer les API routes Phase 1**:
   - `src/app/api/rag/query/route.ts`
   - `src/app/api/geolocation/route.ts`
7. **Tester le RAG**: Questions → Réponses avec sources
8. **Commit & Push vers GitHub**

---

## 📊 STATUT GLOBAL

| Composant | Statut | Priorité |
|-----------|--------|----------|
| Clés API | ⚠️ 80% | 🔴 HIGH |
| Schema Prisma | ✅ 100% | ✅ DONE |
| Dépendances | ✅ 100% | ✅ DONE |
| Base de données | ❌ 0% | 🔴 HIGH |
| Service RAG | ⚠️ 30% | 🔴 HIGH |
| APIs Phase 1 | ❌ 0% | 🔴 HIGH |
| Upload & OCR | ❌ 0% | 🟡 MEDIUM |
| Paiement Stripe | ❌ 0% | 🟡 MEDIUM |
| Dashboard | ❌ 0% | 🟡 MEDIUM |
| Purge RGPD | ❌ 0% | 🟢 LOW |

---

## 💡 NOTES IMPORTANTES

### Stripe (Mode LIVE activé)
⚠️ La clé fournie est une **clé LIVE** (`sk_live_...`). Attention aux tests !
- Pour tester: Utiliser une clé test (`sk_test_...`)
- Pour production: Garder la clé live

### Supabase
- Projet: `dyyvacebveqmrloriymr`
- Région: EU Central (Frankfurt)
- Storage bucket `documents` à créer manuellement

### Anthropic Claude
- Modèle: `claude-3-5-sonnet-20241022`
- Usage: RAG strict + OCR Vision
- Système prompt CRITIQUE (voir plan)

---

**Date**: 2026-02-15
**Auteur**: MiniMax Agent
**Repository**: https://github.com/SO2304/legaltech.git
