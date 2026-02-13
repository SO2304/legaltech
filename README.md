# FlashJuris

**Service de transfert sécurisé de documents juridiques**

Multi-juridiction : 🇫🇷 France | 🇧🇪 Belgique | 🇨🇭 Suisse | 🇱🇺 Luxembourg

## 🚀 Fonctionnalités

- **QR Code unique** par avocat (service gratuit)
- **Paiement en ligne** selon le pays (149€ FR, 159€ BE, 149CHF CH, 169€ LU)
- **Envoi automatique** des documents en ZIP à l'avocat
- **Commission 20%** pour l'avocat via Stripe
- **Purge automatique J+7** (conformité RGPD/LPD)
- **Audit trail complet** pour la traçabilité juridique

## 🏗️ Architecture

```
src/
├── lib/
│   ├── audit-service.ts     # Traçabilité juridique
│   ├── case-service.ts      # Logique métier dossiers
│   ├── document-service.ts  # Gestion documents
│   ├── rgpd-service.ts      # Conformité RGPD
│   ├── email-service.ts     # Envoi emails + ZIP
│   ├── countries.ts         # Config multi-pays
│   └── utils.ts             # Utilitaires communs
├── app/
│   ├── api/
│   │   ├── lawyers/[id]/    # Infos avocat
│   │   ├── scan/create      # Création dossier
│   │   ├── scan/upload      # Upload documents
│   │   └── cron/purge       # CRON RGPD
│   ├── scan/[id]/           # Page client
│   └── page.tsx             # Landing page
└── prisma/
    └── schema.prisma        # Schéma PostgreSQL
```

## 🛠️ Développement

```bash
# Installation
bun install

# Base de données
bun run db:push

# Développement
bun run dev

# Build
bun run build
```

## 🚀 Déploiement sur Render.com (Gratuit)

### Option 1 : Via render.yaml

1. Forkez ce repo sur GitHub
2. Allez sur [render.com](https://render.com)
3. New → Blueprint → Connectez votre repo
4. Render détectera automatiquement `render.yaml`

### Option 2 : Manuel

1. **Créer la base de données**
   - New → PostgreSQL
   - Name: `flashjuris-db`
   - Region: Frankfurt (Europe)
   - Copier l'URL de connexion

2. **Créer le service web**
   - New → Web Service
   - Connectez votre repo GitHub
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Ajoutez les variables d'environnement :

```
DATABASE_URL=<url-postgres>
NEXT_PUBLIC_APP_URL=https://votre-app.onrender.com
RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_xxx
CRON_SECRET=xxx
```

## 📋 Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL de l'app | ✅ |
| `RESEND_API_KEY` | Clé API Resend | ✅ |
| `STRIPE_SECRET_KEY` | Clé API Stripe | ✅ |
| `CRON_SECRET` | Secret pour CRON | ✅ |

## 📜 Licence

Propriétaire - Tous droits réservés
