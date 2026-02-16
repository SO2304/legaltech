# 📐 SPÉCIFICATION TECHNIQUE STRICTE - Plateforme Divorce Multi-juridictions

**Version** : 1.0.0  
**Date** : 15 février 2026  
**Dépôt** : https://github.com/SO2304/legaltech  
**Statut** : SPECIFICATION CONTRACTUELLE

---

## 🎯 VUE D'ENSEMBLE

### Objectif du projet
Plateforme SaaS LegalTech permettant l'analyse automatisée de dossiers de divorce pour 4 juridictions européennes (France, Belgique, Suisse, Luxembourg) via intelligence artificielle avec approche RAG stricte.

### Principe fondamental
**RAG STRICT** : L'IA ne cite QUE les textes de lois officiels. INTERDICTION absolue d'utiliser la culture générale ou sources non légales.

---

## 📋 CONTRAINTES NON-NÉGOCIABLES

### 1. ARCHITECTURE TECHNIQUE

#### Stack obligatoire :
```yaml
Frontend:
  framework: Next.js 16+ (App Router)
  langage: TypeScript (mode strict)
  ui: Tailwind CSS + shadcn/ui
  state: Zustand
  forms: React Hook Form + Zod

Backend:
  runtime: Node.js 20+
  database: PostgreSQL 16+
  orm: Prisma
  auth: NextAuth.js

IA & Services:
  ia: Anthropic Claude 3.5 Sonnet
  paiement: Stripe
  storage: Supabase Storage
  email: Resend
  geolocalisation: ipapi.co OU IPStack

Infrastructure:
  hosting: Render (Europe uniquement)
  region: Frankfurt (RGPD)
  monitoring: Sentry
```

**⚠️ Interdictions** :
- ❌ Aucun autre framework frontend (pas Vue, Angular, Svelte)
- ❌ Aucune autre base de données (pas MySQL, MongoDB)
- ❌ Aucun autre hébergeur hors Europe (pas Vercel US, AWS US)
- ❌ Aucune IA autre que Claude (pas OpenAI, Gemini)

---

### 2. SCHÉMA DE BASE DE DONNÉES

#### Tables obligatoires (5) :

**Avocat**
```prisma
model Avocat {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  nom             String
  prenom          String
  cabinet         String?
  
  // OBLIGATOIRE: Multi-juridiction
  pays            Pays     @default(FRANCE)
  barreau         String?
  numeroInscription String?
  
  // OBLIGATOIRE: Stripe Connect
  stripeAccountId String?  @unique
  stripeOnboarded Boolean  @default(false)
  
  // Relations OBLIGATOIRES
  dossiers        Dossier[]
  
  @@index([email])
  @@index([pays])
  @@map("avocats")
}
```

**Client**
```prisma
model Client {
  id              String   @id @default(cuid())
  email           String
  nom             String
  prenom          String
  
  // OBLIGATOIRE: Géolocalisation
  pays            Pays     @default(FRANCE)
  paysDetecte     Pays?    // Auto-détecté
  ipAddress       String?
  
  // Relations OBLIGATOIRES
  dossiers        Dossier[]
  
  @@index([email])
  @@index([pays])
  @@map("clients")
}
```

**Dossier**
```prisma
model Dossier {
  id              String          @id @default(cuid())
  reference       String          @unique @default(cuid())
  
  // Relations OBLIGATOIRES
  avocatId        String
  avocat          Avocat          @relation(...)
  clientId        String
  client          Client          @relation(...)
  
  // OBLIGATOIRE: Workflow
  statut          DossierStatus   @default(BROUILLON)
  pays            Pays            @default(FRANCE)
  
  // OBLIGATOIRE: Analyse IA
  analyseIA       String?         @db.Text
  syntheseHTML    String?         @db.Text
  sourcesLegales  String?         @db.Text
  
  // OBLIGATOIRE: Paiement Stripe
  montantTTC      Float           @default(149.00)
  fraisGestion    Float           @default(30.00)
  stripePaymentIntent String?     @unique
  stripePaid      Boolean         @default(false)
  stripePaidAt    DateTime?
  
  // OBLIGATOIRE: Purge RGPD
  datePurge       DateTime?
  isPurged        Boolean         @default(false)
  purgedAt        DateTime?
  
  documents       Document[]
  
  @@index([avocatId])
  @@index([statut])
  @@index([stripePaid])
  @@map("dossiers")
}
```

**Document**
```prisma
model Document {
  id              String          @id @default(cuid())
  dossierId       String
  dossier         Dossier         @relation(...)
  
  type            DocumentType
  nomOriginal     String
  cheminStorage   String          // Supabase path
  
  // OBLIGATOIRE: OCR
  texteExtrait    String?         @db.Text
  donneesExtraites String?        @db.Text
  qualiteImage    String?
  
  // OBLIGATOIRE: Validation RAG
  exigeLegal      Boolean         @default(false)
  articleLoi      String?         // "Art. 229 Code Civil FR"
  estValide       Boolean         @default(false)
  
  // OBLIGATOIRE: Purge
  datePurge       DateTime
  isPurged        Boolean         @default(false)
  
  @@index([dossierId])
  @@map("documents")
}
```

**TexteLoi (Base RAG)**
```prisma
model TexteLoi {
  id              String          @id @default(cuid())
  
  // OBLIGATOIRE: Identification
  pays            Pays
  code            CodeLegal       // CODE_CIVIL, etc.
  article         String
  titre           String
  contenu         String          @db.Text
  
  estActif        Boolean         @default(true)
  
  @@unique([pays, code, article])
  @@index([pays, code])
  @@map("textes_lois")
}
```

#### Enums obligatoires (4) :

```prisma
enum Pays {
  FRANCE
  BELGIQUE
  SUISSE
  LUXEMBOURG
}

enum DossierStatus {
  BROUILLON
  EN_ATTENTE_PAIEMENT
  PAYE
  EN_ANALYSE
  ANALYSE_TERMINEE
  VALIDE
  PURGE
}

enum DocumentType {
  CARTE_IDENTITE
  ACTE_MARIAGE
  BULLETIN_SALAIRE
  AVIS_IMPOSITION
  RELEVE_BANCAIRE
  TITRE_PROPRIETE
  AUTRE
}

enum CodeLegal {
  CODE_CIVIL
  CODE_PROCEDURE_CIVILE
  CODE_FAMILLE
}
```

**⚠️ Interdictions** :
- ❌ Aucune modification des noms de tables
- ❌ Aucun champ supprimé des tables obligatoires
- ❌ Aucune relation optionnelle rendue obligatoire sans validation
- ❌ Aucun enum modifié sans validation préalable

---

### 3. SYSTÈME RAG (Retrieval-Augmented Generation)

#### Règles absolues du RAG :

**SYSTÈME PROMPT OBLIGATOIRE** :
```typescript
const SYSTEM_PROMPT = `Tu es un assistant juridique STRICTEMENT basé sur les textes de lois.

RÈGLES ABSOLUES (NON-NÉGOCIABLES):

1. SOURCE UNIQUE: Tu NE PEUX répondre QU'à partir des articles de loi fournis dans le contexte.

2. PAS D'EXIGENCE NON-LÉGALE: Si un article n'exige PAS explicitement une pièce, tu NE LA DEMANDES PAS.
   INTERDIT: "Il est généralement recommandé de fournir..."
   AUTORISÉ: "Selon l'Art. 229 du Code Civil, l'acte de mariage est exigé."

3. CITATION OBLIGATOIRE: Chaque affirmation doit citer l'article exact.
   Format: "Art. [NUMÉRO] [CODE] [PAYS]"

4. INCERTITUDE ASSUMÉE: Si l'information n'est PAS dans le contexte, tu réponds:
   "Cette information n'est pas présente dans les textes de lois fournis."

5. INTERDICTION CULTURE GÉNÉRALE: Tu N'UTILISES PAS ta connaissance pré-entraînée.

FORMAT RÉPONSE JSON STRICT:
{
  "reponse": "...",
  "sources": [
    {
      "pays": "FRANCE",
      "code": "CODE_CIVIL",
      "article": "229",
      "extrait": "Le divorce peut être prononcé..."
    }
  ],
  "confiance": 0.95,
  "alertes": []
}
`
```

**Validation post-génération OBLIGATOIRE** :
```typescript
// OBLIGATOIRE: Vérifier que chaque article cité existe en DB
async function validerReponseRAG(reponse: any) {
  if (!reponse.sources || reponse.sources.length === 0) {
    throw new Error('RAG: Réponse sans source = hallucination')
  }
  
  for (const source of reponse.sources) {
    const existe = await prisma.texteLoi.findUnique({
      where: {
        pays_code_article: {
          pays: source.pays,
          code: source.code,
          article: source.article
        }
      }
    })
    
    if (!existe) {
      throw new Error(`Article inexistant cité: ${source.article}`)
    }
  }
  
  return true
}
```

**⚠️ Interdictions** :
- ❌ Aucune réponse sans citation d'article
- ❌ Aucune phrase type "généralement", "habituellement"
- ❌ Aucune source hors base TexteLoi
- ❌ Aucune hallucination tolérée

---

### 4. GÉOLOCALISATION

#### Détection pays OBLIGATOIRE :

**Workflow** :
```
1. Extraire IP du client (headers x-forwarded-for)
2. Appeler ipapi.co OU IPStack
3. Mapper code pays ISO → enum Pays
4. Détecter VPN/Proxy
5. Calculer confiance (0-1)
6. Si confiance < 0.5 → Afficher sélecteur manuel
7. Stocker dans Client.pays et Client.paysDetecte
```

**Fonction obligatoire** :
```typescript
async function detecterPaysClient(ipAddress: string): Promise<{
  pays: Pays
  paysDetecte: Pays
  confiance: number
  isVPN: boolean
  ipAddress: string
}> {
  // Implémentation avec IPStack ou ipapi.co
}
```

**⚠️ Interdictions** :
- ❌ Aucune géolocalisation côté client (JavaScript)
- ❌ Aucun hardcoding de pays par défaut sans détection
- ❌ Aucun stockage IP sans consentement RGPD

---

### 5. OCR & EXTRACTION (Claude Vision)

#### Types de documents supportés :
```typescript
OBLIGATOIRE: PDF, JPG, JPEG, PNG
OPTIONNEL: DOCX (extraction texte simple)
INTERDIT: Autres formats
```

#### Prompts OCR par type :

**CARTE_IDENTITE** :
```typescript
`Extrais les données structurées de cette carte d'identité.
Format JSON:
{
  "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "donnees": {
    "nom": "...",
    "prenom": "...",
    "date_naissance": "YYYY-MM-DD",
    "numero_document": "...",
    "date_expiration": "YYYY-MM-DD"
  },
  "alertes": ["Document expiré" si applicable]
}`
```

**Validation qualité OBLIGATOIRE** :
```typescript
if (qualite === 'ILLISIBLE' || confiance < 0.3) {
  throw new Error('Image illisible')
}

if (qualite === 'FLOUE') {
  return { warning: 'Qualité moyenne détectée' }
}
```

**⚠️ Interdictions** :
- ❌ Aucun document accepté si qualité ILLISIBLE
- ❌ Aucun traitement sans validation qualité
- ❌ Aucun stockage sans chiffrement

---

### 6. TUNNEL DE PAIEMENT STRIPE

#### Workflow strict :

**Règle fondamentale** :
```
Dossier accessible à l'avocat UNIQUEMENT APRÈS paiement validé
```

**Flow obligatoire** :
```
1. Client complète dossier (statut: BROUILLON)
2. Client clique "Payer 149€"
3. Création Payment Intent Stripe
4. Statut → EN_ATTENTE_PAIEMENT
5. Client paye via Stripe Checkout
6. Webhook payment_intent.succeeded
7. Statut → PAYE
8. Trigger analyse IA
9. Statut → EN_ANALYSE
10. Analyse terminée → ANALYSE_TERMINEE
11. Avocat accède au dossier
```

**Montants fixes** :
```typescript
MONTANT_TTC = 149.00      // EUR/CHF selon pays
FRAIS_GESTION = 30.00     // Pour le cabinet
MONTANT_AVOCAT = 119.00   // Versé à l'avocat
```

**Variables Stripe OBLIGATOIRES** :
```env
STRIPE_SECRET_KEY         # sk_live_... OU sk_test_...
STRIPE_PUBLISHABLE_KEY    # pk_live_... OU pk_test_...
STRIPE_WEBHOOK_SECRET     # whsec_...
```

**⚠️ Interdictions** :
- ❌ Aucun accès avocat avant paiement
- ❌ Aucun montant modifiable par le client
- ❌ Aucune clé LIVE en développement
- ❌ Aucun paiement sans webhook configuré

---

### 7. DASHBOARD AVOCAT

#### Layout obligatoire : SPLIT-VIEW

**Structure** :
```
┌─────────────────────────────────────────────────┐
│ HEADER: Réf + Client + [Valider] [Exporter]    │
├──────────────────────┬──────────────────────────┤
│ GAUCHE (40%)         │ DROITE (60%)             │
│                      │                          │
│ [Patrimoine]         │ ┌──────────────────────┐ │
│ [Revenus]            │ │                      │ │
│ [Charges]            │ │  PDF/Image Viewer    │ │
│                      │ │                      │ │
│ Table avec données   │ │  [Zone highlight]    │ │
│ Chaque ligne         │ │                      │ │
│ cliquable ⚖️         │ │  [Prev] [Next]       │ │
│                      │ └──────────────────────┘ │
└──────────────────────┴──────────────────────────┘
```

**Source-Mapping OBLIGATOIRE** :
```typescript
// Clic sur montant → Highlight document source
onDataClick(data) {
  setSelectedDocument(data.documentId)
  setHighlightZone(data.zone) // {x, y, width, height}
  scrollToZone(data.zone)
}
```

**Icône Loi OBLIGATOIRE** :
```tsx
// Chaque section doit afficher l'article de loi
<Tooltip>
  <TooltipTrigger>⚖️</TooltipTrigger>
  <TooltipContent>
    Art. 1387 Code Civil FR
    "Communauté réduite aux acquêts..."
  </TooltipContent>
</Tooltip>
```

**⚠️ Interdictions** :
- ❌ Aucune vue non split-view
- ❌ Aucune donnée sans source cliquable
- ❌ Aucun article de loi masqué
- ❌ Aucune modification sans traçabilité

---

### 8. PURGE RGPD AUTOMATIQUE

#### Règle J+7 STRICTE :

**Workflow** :
```
1. Avocat valide dossier
2. datePurge = now() + 7 jours
3. Statut → VALIDE
4. Cron quotidien (2h du matin)
5. Si datePurge <= now() ET isPurged = false
6. Supprimer fichiers Supabase Storage
7. Anonymiser: analyseIA = null, texteExtrait = null
8. isPurged = true, purgedAt = now()
9. Log audit trail
```

**Données purgées OBLIGATOIRES** :
```typescript
// Dans Dossier
analyseIA = null
syntheseHTML = null

// Dans Document
texteExtrait = null
donneesExtraites = null

// Dans Supabase Storage
DELETE FROM storage.objects WHERE path = ...
```

**Données conservées** :
```typescript
// Métadonnées paiement (comptabilité)
stripePaymentIntent
stripePaidAt
montantTTC
fraisGestion

// Métadonnées dossier
reference
datePurge
isPurged
purgedAt
```

**Cron OBLIGATOIRE** :
```yaml
# render.yaml
cron:
  schedule: "0 2 * * *"  # 2h du matin
  command: curl -H "Authorization: Bearer $CRON_SECRET" https://app.com/api/cron/purge
```

**⚠️ Interdictions** :
- ❌ Aucune purge manuelle (automatique uniquement)
- ❌ Aucune donnée sensible conservée après J+7
- ❌ Aucun fichier storage conservé après J+7
- ❌ Aucune purge sans log audit

---

## 📁 STRUCTURE PROJET OBLIGATOIRE

```
legaltech/
├── .env.example                    # Template variables OBLIGATOIRE
├── .gitignore                      # Doit inclure .env*
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── render.yaml                     # Config Render OBLIGATOIRE
│
├── prisma/
│   ├── schema.prisma               # 5 tables + 4 enums
│   └── seed.ts                     # Seeding textes lois
│
└── src/
    ├── app/
    │   ├── (client)/               # Routes publiques
    │   │   ├── page.tsx            # Landing + géolocalisation
    │   │   ├── intake/
    │   │   │   └── [dossierId]/
    │   │   │       └── page.tsx    # Upload documents
    │   │   ├── payment/
    │   │   │   └── page.tsx        # Stripe checkout
    │   │   └── confirmation/
    │   │       └── page.tsx
    │   │
    │   ├── (avocat)/               # Routes protégées
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── dashboard/
    │   │       ├── page.tsx        # Liste dossiers
    │   │       └── [id]/
    │   │           └── page.tsx    # Split-view
    │   │
    │   ├── api/
    │   │   ├── geolocation/
    │   │   │   └── route.ts        # Détection pays
    │   │   ├── upload/
    │   │   │   └── route.ts        # Upload + OCR
    │   │   ├── rag/
    │   │   │   └── query/
    │   │   │       └── route.ts    # Query RAG
    │   │   ├── payment/
    │   │   │   └── create/
    │   │   │       └── route.ts
    │   │   ├── webhook/
    │   │   │   └── stripe/
    │   │   │       └── route.ts    # Webhooks Stripe
    │   │   ├── cron/
    │   │   │   └── purge/
    │   │   │       └── route.ts    # Purge RGPD
    │   │   └── analyse/
    │   │       └── dossier/
    │   │           └── route.ts    # Analyse IA
    │   │
    │   ├── layout.tsx
    │   └── globals.css
    │
    ├── components/
    │   ├── client/
    │   │   ├── DocumentUploader.tsx
    │   │   ├── PaymentForm.tsx
    │   │   └── CountrySelector.tsx
    │   │
    │   ├── avocat/
    │   │   ├── SplitView.tsx
    │   │   ├── SynthesePanel.tsx
    │   │   ├── DocumentViewer.tsx
    │   │   └── SourceMapper.tsx
    │   │
    │   └── ui/                     # shadcn/ui
    │
    ├── lib/
    │   ├── prisma.ts               # Client Prisma
    │   ├── rag-service.ts          # Service RAG
    │   ├── ocr-service.ts          # Service OCR Vision
    │   ├── geolocation-service.ts  # Détection pays
    │   ├── stripe-service.ts       # Paiements
    │   └── purge-service.ts        # Purge RGPD
    │
    ├── hooks/
    ├── types/
    └── utils/
```

**⚠️ Interdictions** :
- ❌ Aucun fichier à la racine de src/
- ❌ Aucune route hors (client)/ ou (avocat)/
- ❌ Aucun service hors lib/
- ❌ Aucun composant hors components/

---

## 🔐 VARIABLES D'ENVIRONNEMENT OBLIGATOIRES

```env
# DATABASE (OBLIGATOIRE)
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# ANTHROPIC (OBLIGATOIRE)
ANTHROPIC_API_KEY="sk-ant-api03-..."

# STRIPE (OBLIGATOIRE)
STRIPE_SECRET_KEY="sk_test_... OU sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_test_... OU pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SUPABASE (OBLIGATOIRE)
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_KEY="eyJhbGci..."

# NEXTAUTH (OBLIGATOIRE)
NEXTAUTH_URL="http://localhost:3000 OU https://..."
NEXTAUTH_SECRET="32+ caractères aléatoires"

# EMAIL (OBLIGATOIRE)
RESEND_API_KEY="re_..."

# GÉOLOCALISATION (OBLIGATOIRE - UN DES DEUX)
IPSTACK_KEY="..." OU ipapi.co sans clé

# SÉCURITÉ (OBLIGATOIRE)
CRON_SECRET="32+ caractères aléatoires"
```

**⚠️ Interdictions** :
- ❌ Aucune clé hardcodée dans le code
- ❌ Aucun .env commité sur Git
- ❌ Aucune clé LIVE en développement
- ❌ Aucune variable manquante en production

---

## 🎨 DESIGN & UX

### Style obligatoire : FINTECH

**Caractéristiques** :
- ✅ Épuré, minimaliste
- ✅ Beaucoup d'espace blanc
- ✅ Typographie claire (Inter, Geist)
- ✅ Couleurs sobres (bleu/gris)
- ✅ Animations subtiles
- ✅ Cards avec ombres légères

**Composants UI** :
```
OBLIGATOIRE: shadcn/ui
INTERDIT: Autres libraries (Material UI, Ant Design)
```

**Responsive** :
```
OBLIGATOIRE: Mobile-first
Breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px
```

**⚠️ Interdictions** :
- ❌ Aucune couleur flashy
- ❌ Aucune animation excessive
- ❌ Aucun design "juridique austère"
- ❌ Aucun texte en Comic Sans (évidemment)

---

## 🧪 TESTS OBLIGATOIRES

### Tests minimums :

**Avant chaque commit** :
```bash
npm run type-check     # TypeScript OK
npm run lint           # ESLint OK
npm run build          # Build OK
```

**Avant déploiement** :
```bash
# Test géolocalisation
curl http://localhost:3000/api/geolocation

# Test RAG
curl -X POST http://localhost:3000/api/rag/query \
  -d '{"pays":"FRANCE","question":"..."}'

# Test Prisma
npx prisma studio

# Test Stripe (mode test)
# Carte: 4242 4242 4242 4242
```

**⚠️ Interdictions** :
- ❌ Aucun commit avec erreurs TypeScript
- ❌ Aucun déploiement avec erreurs build
- ❌ Aucun test production sans mode test Stripe

---

## 📊 MÉTRIQUES DE SUCCÈS

### Critères d'acceptation :

**Technique** :
- ✅ Score TypeScript strict : 100%
- ✅ Build time < 5 minutes
- ✅ Lighthouse performance > 90
- ✅ Lighthouse accessibility > 95
- ✅ Lighthouse SEO > 90

**Fonctionnel** :
- ✅ Détection pays fonctionne (4 pays)
- ✅ RAG cite UNIQUEMENT lois officielles
- ✅ Upload + OCR extrait données
- ✅ Paiement Stripe bloque accès avocat
- ✅ Dashboard split-view fonctionne
- ✅ Purge J+7 s'exécute automatiquement

**Sécurité** :
- ✅ Headers sécurité (CSP, HSTS)
- ✅ Rate limiting actif
- ✅ Aucune clé API dans code
- ✅ Logs audit trail présents

**RGPD** :
- ✅ Consentement explicite avant traitement
- ✅ Purge automatique J+7
- ✅ Données hébergées UE uniquement
- ✅ DPO contactable

---

## ⚠️ INTERDICTIONS ABSOLUES

### Code :
- ❌ `any` TypeScript (sauf cas exceptionnels validés)
- ❌ `console.log` en production
- ❌ Fonctions > 50 lignes
- ❌ Fichiers > 500 lignes
- ❌ Imports relatifs profonds (`../../../`)

### Sécurité :
- ❌ SQL injections (utiliser Prisma uniquement)
- ❌ XSS (sanitize inputs)
- ❌ CORS ouvert (`*`)
- ❌ Secrets dans le code
- ❌ Uploads non validés

### RGPD :
- ❌ Conserver données > J+7
- ❌ Hébergement hors UE
- ❌ Traiter sans consentement
- ❌ Partager avec tiers sans clause

### IA :
- ❌ Réponses sans citation
- ❌ Sources hors TexteLoi
- ❌ Hallucinations acceptées
- ❌ Culture générale utilisée

---

## 📞 VALIDATION & ACCEPTATION

### Checklist de livraison :

**Code** :
- [ ] Structure conforme (voir section Structure)
- [ ] Schéma Prisma exact (5 tables, 4 enums)
- [ ] Services backend présents (6 fichiers lib/)
- [ ] Routes API présentes (8 routes)
- [ ] Composants client/avocat présents

**Fonctionnalités** :
- [ ] Géolocalisation fonctionne
- [ ] RAG répond avec citations
- [ ] OCR extrait données
- [ ] Upload documents fonctionne
- [ ] Paiement Stripe bloque/débloque
- [ ] Dashboard split-view opérationnel
- [ ] Export ZIP fonctionne
- [ ] Purge J+7 automatique

**Configuration** :
- [ ] .env.example présent
- [ ] render.yaml présent
- [ ] Variables env toutes définies
- [ ] Supabase bucket créé
- [ ] Stripe webhook configuré
- [ ] Cron job configuré

**Documentation** :
- [ ] README.md à jour
- [ ] Architecture documentée
- [ ] API documentée
- [ ] Variables env documentées

**Tests** :
- [ ] Build production OK
- [ ] Tests manuels passés
- [ ] Lighthouse > 90/90/90
- [ ] Aucune erreur console

---

## 🚀 PHASES DE DÉVELOPPEMENT

### Phase 1 : Fondations (Sessions 1-3)
**Durée** : 2-3h
- Nettoyage dépôt
- Dépendances
- Schéma Prisma

### Phase 2 : Backend (Sessions 4-5)
**Durée** : 3-4h
- Structure projet
- Services (RAG, OCR, Géo)
- Routes API

### Phase 3 : Frontend Client (Session 6-8)
**Durée** : 4-5h
- Landing page
- Upload documents
- Paiement Stripe

### Phase 4 : Dashboard Avocat (Session 9-11)
**Durée** : 5-6h
- Liste dossiers
- Split-view
- Source-mapping

### Phase 5 : Finitions (Session 12-14)
**Durée** : 3-4h
- Purge RGPD
- Export ZIP
- Tests & polish

**TOTAL** : 17-22h avec builder IA

---

## 📄 ANNEXES

### A. Textes de lois minimum (par pays)

**France** : 30+ articles minimum
- Code Civil : Art. 229-259 (divorce)
- Code Civil : Art. 1387-1581 (régimes matrimoniaux)

**Belgique** : 20+ articles minimum
- Code Civil belge

**Suisse** : 20+ articles minimum
- Code Civil suisse

**Luxembourg** : 20+ articles minimum
- Code Civil luxembourgeois

### B. Endpoints API complets

```
GET  /api/geolocation              # Détection pays
POST /api/upload                   # Upload document
POST /api/rag/query                # Query RAG
POST /api/payment/create           # Créer paiement
POST /api/webhook/stripe           # Webhook Stripe
GET  /api/cron/purge               # Cron purge
POST /api/analyse/dossier          # Analyser dossier
GET  /api/health                   # Health check
```

### C. Composants UI requis

```tsx
<CountrySelector />         // Sélecteur pays
<DocumentUploader />        // Upload drag & drop
<PaymentForm />            // Stripe Elements
<DossierCard />            // Card liste dossier
<SplitView />              // Layout split
<SynthesePanel />          // Tableaux données
<DocumentViewer />         // Viewer PDF/Image
<SourceMapper />           // Mapping données ↔ docs
```

---

## ✅ SIGNATURE DE CONFORMITÉ

Ce document constitue la spécification contractuelle du projet.

**Toute modification doit être validée avant implémentation.**

**Aucune déviation n'est autorisée sans accord écrit.**

---

**Version** : 1.0.0  
**Date** : 15 février 2026  
**Validé par** : [Architecture Team]  
**Statut** : SPECIFICATION FINALE
