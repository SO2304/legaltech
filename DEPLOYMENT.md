# FlashJuris - Vercel Deployment

Ce projet est configuré pour être déployé sur Vercel avec PostgreSQL (Supabase).

## 🚀 Déploiement Rapide

### 1. Variables d'environnement requises

Dans Vercel Dashboard > Settings > Environment Variables :

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
STRIPE_SECRET_KEY=sk_live_xxx
RESEND_API_KEY=re_xxx
ENCRYPTION_KEY=your-32-character-encryption-key
CRON_SECRET=your-random-secret
```

### 2. Déployer

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SO2304/legaltech)

### 3. Initialiser la base de données

Après le déploiement, exécutez les migrations :

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 📋 Configuration Vercel

- **Région** : cdg1 (Paris)
- **Build Command** : `prisma generate && prisma migrate deploy && next build`
- **Install Command** : `bun install`
- **Cron Job** : Purge automatique toutes les heures (`/api/cron/purge`)

## 🗄️ Base de Données

### Supabase Setup

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans Settings > Database
3. Copiez les URLs de connexion :
   - **Connection string (URI)** → `DATABASE_URL`
   - **Connection string (JDBC)** → Modifiez pour `DIRECT_DATABASE_URL`

### Migrations

```bash
# Générer une migration
npx prisma migrate dev --name init

# Appliquer en production
npx prisma migrate deploy
```

## 🔄 Cron Jobs

Le projet utilise les Vercel Cron Jobs pour :
- **Purge automatique** : Suppression des données après 7 jours
- **Fréquence** : Toutes les heures

## 📧 Emails

Configurer [Resend](https://resend.com) :
1. Créez un compte
2. Vérifiez votre domaine
3. Copiez la clé API

## 💳 Paiements

Configurer [Stripe](https://stripe.com) :
1. Créez un compte
2. Récupérez les clés API (test/live)
3. Configurez Stripe Connect pour les avocats

## 🔒 Sécurité

- Documents chiffrés (AES-256)
- Purge automatique J+7
- RGPD/LPD compliant
- HTTPS obligatoire

## 🌍 Juridictions

| Pays | Devise | Prix |
|------|--------|------|
| 🇫🇷 France | EUR | 149€ |
| 🇧🇪 Belgique | EUR | 159€ |
| 🇨🇭 Suisse | CHF | 149 CHF |
| 🇱🇺 Luxembourg | EUR | 169€ |
