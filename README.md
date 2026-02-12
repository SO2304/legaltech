# ⚡ FlashJuris - Scan-to-Report pour Avocats

**Recevez les documents de vos clients en un scan.** 

FlashJuris est un SaaS révolutionnaire qui permet aux avocats de recevoir des documents de leurs clients sans dashboard, sans application - juste un QR Code et l'email.

## 🎯 Le Concept

```
1. L'avocat reçoit son QR Code par email
2. Il le pose sur son bureau
3. Le client scanne → Remplit le formulaire → Upload ses documents
4. L'avocat reçoit le rapport d'analyse IA directement par email
```

**Zéro friction. Zéro dashboard. Zéro support.**

## 🚀 Fonctionnalités

- **QR Code unique** : Chaque avocat a son QR Code personnalisé
- **Interface mobile-first** : Optimisée pour smartphone (90% des scans)
- **Analyse IA** : GLM-5 analyse les documents et génère une synthèse
- **Email automatique** : Rapport envoyé directement à l'avocat
- **RGPD compliant** : Documents supprimés après 30 jours

## 🛠️ Stack Technique

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Prisma ORM, API Routes Next.js
- **Database**: SQLite (dev) / PostgreSQL Supabase (prod)
- **IA**: GLM-5 via z-ai-web-dev-sdk
- **QR Code**: qrcode (npm)
- **Email**: Resend / SendGrid

## 📁 Structure

```
src/
├── app/
│   ├── api/
│   │   ├── lawyers/           # Inscription avocats
│   │   ├── scan/              # Création dossiers & upload
│   │   └── analysis/          # Déclenchement analyse IA
│   ├── scan/[id]/             # Page de capture mobile
│   └── page.tsx               # Landing page
├── lib/
│   ├── qrcode/                # Génération QR codes
│   ├── analysis-service.ts    # Analyse IA GLM-5
│   └── email-service.ts       # Envoi rapports email
└── prisma/
    └── schema.prisma          # Modèles: Lawyer, Case, Document, Analysis
```

## 🗄️ Modèles de Données

| Table | Description |
|-------|-------------|
| `Lawyer` | Avocat avec QR code unique |
| `Case` | Dossier client |
| `Document` | Documents uploadés avec purge auto |
| `Analysis` | Résultats de l'analyse IA |
| `Payment` | Paiements Stripe |
| `Event` | Audit trail |

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

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/scan/[lawyerId]` | Page de capture pour clients |

## 📝 Variables d'Environnement

```env
# Database
DATABASE_URL="file:./db/custom.db"

# App URL (pour les QR codes)
NEXT_PUBLIC_APP_URL="https://flashjuris.com"

# Email (Resend)
RESEND_API_KEY="re_xxx"

# Encryption
ENCRYPTION_KEY="your-32-char-encryption-key"
```

## 🧪 Démo

- **Avocat ID** : `demo-lawyer`
- **Scan URL** : `http://localhost:3000/scan/demo-lawyer`

## 💡 Pitch Commercial

> "Donnez-moi votre email, je vous envoie votre QR code. Posez-le sur votre bureau, vous recevrez les rapports d'analyse de vos clients directement dans votre boîte mail."

## 📈 Avantages Business

1. **Vente instantanée** : Pitch en 10 secondes
2. **Zéro support** : Pas de dashboard à expliquer
3. **Friction zéro** : Pas d'app à télécharger pour le client
4. **Valeur immédiate** : L'avocat reçoit son QR code en 30 secondes

## 📄 License

MIT
