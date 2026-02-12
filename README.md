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

## 📁 Structure

```
src/
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

## 🔧 Installation

```bash
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

## 📄 License

MIT
