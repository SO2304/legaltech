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

## 📁 Structure

```
src/
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

## 🔧 Installation

```bash
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

## 📄 License

MIT
