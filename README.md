<<<<<<< HEAD
# ⚡ FlashJuris - Scan-to-Report Multi-Juridiction

**Recevez les documents de vos clients en un scan.** 

Disponible en **France, Belgique, Suisse et Luxembourg** avec adaptation automatique selon la juridiction.

## 🌍 Juridictions Supportées

| Pays | Prix Client | Commission Avocat | Devise |
|------|-------------|-------------------|--------|
| 🇫🇷 France | 149 € | 29,80 € | EUR |
| 🇧🇪 Belgique | 159 € | 31,80 € | EUR |
| 🇨🇭 Suisse | 149 CHF | 29,80 CHF | CHF |
| 🇱🇺 Luxembourg | 169 € | 33,80 € | EUR |

## 🎯 Le Concept

```
1. L'avocat reçoit son QR Code par email (GRATUIT)
2. Il le pose sur son bureau
3. Le client scanne → Sélectionne son pays → Upload ses documents
4. L'avocat reçoit le ZIP par email + lien Stripe pour sa commission (20%)
```

## 🏛️ Adaptation par Juridiction

### Types d'affaires par pays

**France** : Divorce, Succession, Immobilier, Travail, Famille, Pénal, Commercial, Autre

**Belgique** : Divorce, Succession, Immobilier, Travail, Famille, Pénal, Droit des affaires

**Suisse** : Divorce, Succession, Immobilier, Travail, Famille, Pénal, Poursuites et faillites

**Luxembourg** : Divorce, Succession, Immobilier, Travail, Famille, Droit des sociétés, Fiscal

### Documents suggérés par pays

Chaque pays a ses documents types (CNI, actes, bulletins de salaire, etc.) adaptés à la législation locale.

## 📋 Fonctionnalités

- **Détection automatique du pays** via email/téléphone
- **Prix adapté** selon la devise locale (EUR/CHF)
- **Types d'affaires** spécifiques à chaque juridiction
- **Documents ZIP** envoyés à l'avocat
- **Commission 20%** via Stripe
- **Purge J+7** automatique (RGPD/LPD)
- **Mentions légales** adaptées par pays

## 🛠️ Stack Technique

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Database**: Prisma + SQLite/PostgreSQL
- **Paiement**: Stripe
- **Email**: Resend
- **QR Code**: qrcode (npm)
=======
# Divorce SaaS LegalTech

Plateforme SaaS de préparation de dossiers de divorce par consentement mutuel.

## 🚀 Fonctionnalités

- **Multi-tenant** : Chaque avocat dispose d'une URL personnalisée (`/avocat/[slug]`)
- **Formulaire intelligent** : 8 étapes guidées pour collecter toutes les informations
- **Analyse IA** : RAG avec GLM 5 pour analyser les documents et générer des synthèses
- **Sécurisé** : Chiffrement AES-256 des documents sensibles
- **RGPD** : Purge automatique des documents après 7 jours
- **Commissions** : Tracking des commissions (20%) pour la plateforme

## 🛠️ Stack Technique

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Prisma ORM, API Routes Next.js
- **Database**: SQLite (dev) / PostgreSQL Supabase (prod)
- **IA**: GLM 5 via z-ai-web-dev-sdk
- **State**: Zustand pour la gestion d'état
- **Forms**: React Hook Form + Zod pour la validation
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98

## 📁 Structure

```
src/
<<<<<<< HEAD
├── lib/
│   ├── countries.ts      # Config FR, BE, CH, LU
│   ├── location.ts       # Détection pays
│   └── email-service.ts  # Envoi ZIP + Stripe
├── app/
│   ├── scan/[id]/        # Formulaire multi-pays
│   └── api/scan/         # APIs localisées
└── prisma/
    └── schema.prisma     # country, priceCurrency
```

## 🧪 Démo par Pays

| Pays | URL |
|------|-----|
| France | http://localhost:3000/scan/demo-fr |
| Belgique | http://localhost:3000/scan/demo-be |
| Suisse | http://localhost:3000/scan/demo-ch |
| Luxembourg | http://localhost:3000/scan/demo-lu |
=======
├── app/
│   ├── api/              # Routes API REST
│   │   ├── avocat/[slug] # Récupération avocat
│   │   ├── dossiers/     # CRUD dossiers
│   │   ├── documents/    # Upload documents
│   │   ├── webhook/n8n   # Webhooks automation
│   │   └── cron/purge    # Purge automatique
│   ├── avocat/[slug]/    # Page formulaire multi-tenant
│   └── page.tsx          # Landing page
├── components/
│   ├── forms/            # Composants formulaire multi-étapes
│   └── ui/               # Composants shadcn/ui
├── lib/
│   ├── prisma.ts         # Client Prisma
│   ├── rag-service.ts    # Service RAG GLM 5
│   ├── encryption.ts     # Chiffrement documents
│   └── email.ts          # Templates emails
├── hooks/
│   └── use-divorce-form.ts  # Store Zustand
└── types/                # Types TypeScript
```

## 🗄️ Modèles de Données

- **Avocat** : Informations de l'avocat, slug unique, taux de commission
- **Client** : Informations personnelles du client
- **Dossier** : Dossier de divorce complet avec statut
- **Document** : Documents uploadés avec date de purge
- **Commission** : Tracking des paiements
- **WebhookEvent** : Log des événements n8n
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98

## 🔧 Installation

```bash
<<<<<<< HEAD
bun install
npx prisma db push
npx tsx prisma/seed-flashjuris.ts
bun run dev
```

## 📝 Variables d'Environnement

```env
DATABASE_URL="file:./db/custom.db"
NEXT_PUBLIC_APP_URL="https://flashjuris.com"
RESEND_API_KEY="re_xxx"
STRIPE_SECRET_KEY="sk_xxx"
CRON_SECRET="xxx"
```

=======
# Installer les dépendances
bun install

# Configurer l'environnement
cp .env.example .env

# Initialiser la base de données
bunx prisma db push
bunx prisma db seed

# Lancer en développement
bun run dev
```

## 🌐 URLs

- **Landing** : `http://localhost:3000`
- **Formulaire** : `http://localhost:3000/avocat/[slug]`
- **API** : `http://localhost:3000/api/*`

## 📝 Variables d'Environnement

```env
# Database
DATABASE_URL="file:./db/custom.db"

# Encryption
ENCRYPTION_KEY="your-32-char-encryption-key"

# Commission
COMMISSION_RATE=20

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🧪 Compte Démo

- **Email** : `demo@avocat.fr`
- **Password** : `demo123456`
- **Slug** : `demo-avocat`
- **URL** : `/avocat/demo-avocat`

>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98
## 📄 License

MIT
