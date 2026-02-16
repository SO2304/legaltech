# ⚡ FlashJuris - Scan-to-Report Multi-Juridiction

**Recevez les documents de vos clients en un scan.** 
Plateforme SaaS de préparation de dossiers de divorce par consentement mutuel, disponible en **France, Belgique, Suisse et Luxembourg** avec adaptation automatique selon la juridiction.

## 🎯 Le Concept

1. L'avocat dispose d'un QR Code unique.
2. Le client scanne le code → Accède au formulaire intelligent.
3. Détection automatique de la juridiction → Collecte des documents spécifiques.
4. Analyse IA (RAG) → Synthèse complète pour l'avocat.
5. Paiement Stripe & Commission plateforme (20%).
6. Purge RGPD automatique après 7 jours.

## 🌍 Juridictions Supportées

| Pays | Devise | Commission Avocat |
|------|--------|-------------------|
| 🇫🇷 France | EUR | 29,80 € |
| 🇧🇪 Belgique | EUR | 31,80 € |
| 🇨🇭 Suisse | CHF | 29,80 CHF |
| 🇱🇺 Luxembourg | EUR | 33,80 € |

## 🛠️ Stack Technique

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Prisma ORM, API Routes Next.js
- **Database**: PostgreSQL (Supabase)
- **IA**: Anthropic Claude 3.5 Sonnet (OCR Vision) + Z.ai SDK (RAG)
- **Paiement**: Stripe Connect
- **Email**: Resend

## 📁 Structure du Projet

```
src/
├── app/
│   ├── (client)/         # Espace client (Formulaire multi-étapes)
│   ├── (avocat)/         # Dashboard avocat & Gestion dossiers
│   └── api/              # Routes API (Upload, RAG, Webhooks)
├── lib/
│   ├── rag-service.ts    # Moteur d'analyse juridique IA
│   ├── ocr-service.ts    # Extraction de documents via Claude Vision
│   └── prisma.ts         # Client Database
├── components/           # UI Components (shadcn)
└── types/                # Définitions TypeScript
```

## 🔧 Installation

```bash
# 1. Installer les dépendances
bun install

# 2. Configurer l'environnement
cp .env.example .env

# 3. Synchroniser la base de données
npx prisma db push
npx tsx prisma/seed-flashjuris.ts

# 4. Lancer le serveur de développement
bun run dev
```

## 📄 License

MIT
