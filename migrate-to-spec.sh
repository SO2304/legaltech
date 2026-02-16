#!/bin/bash
# ============================================
# SCRIPT DE MIGRATION AUTOMATIQUE VERS SPEC
# Version: 1.0.0
# ============================================

set -e  # Arrêt si erreur

echo "🚀 Début de la migration vers spécification divorce..."

# ============================================
# ÉTAPE 1: BACKUP
# ============================================
echo ""
echo "📦 ÉTAPE 1/10: Création backup..."

# Créer branche backup
BACKUP_BRANCH="backup-flashjuris-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BACKUP_BRANCH"
git add .
git commit -m "📸 Backup avant migration divorce" || true
git push origin "$BACKUP_BRANCH"

# Retour à main et créer branche de travail
git checkout main
git checkout -b divorce-platform-migration

echo "✅ Backup créé: $BACKUP_BRANCH"

# ============================================
# ÉTAPE 2: NETTOYAGE FICHIERS OBSOLÈTES
# ============================================
echo ""
echo "🗑️  ÉTAPE 2/10: Suppression fichiers obsolètes..."

rm -rf .zscripts
rm -rf browser
rm -rf docs
rm -rf download
rm -rf examples
rm -rf mini-services
rm -f pyproject.toml
rm -f Caddyfile
rm -f workspace.json
rm -f bun.lock

echo "✅ Fichiers obsolètes supprimés"

# ============================================
# ÉTAPE 3: SUPPRESSION CODE FLASHCARDS
# ============================================
echo ""
echo "🗑️  ÉTAPE 3/10: Suppression code flashcards..."

rm -rf src/app/api/flashcards
rm -rf src/app/api/study-sessions
rm -rf src/app/avocat
rm -f src/app/page.tsx

echo "✅ Code flashcards supprimé"

# ============================================
# ÉTAPE 4: INSTALLATION DÉPENDANCES
# ============================================
echo ""
echo "📦 ÉTAPE 4/10: Installation dépendances critiques..."

npm install --save \
  @anthropic-ai/sdk \
  stripe @stripe/stripe-js @stripe/react-stripe-js \
  @supabase/supabase-js \
  resend \
  react-dropzone \
  react-pdf pdfjs-dist \
  pdf-lib \
  jszip

npm install --save-dev @types/uuid

echo "✅ Dépendances installées"

# ============================================
# ÉTAPE 5: CRÉATION STRUCTURE
# ============================================
echo ""
echo "🏗️  ÉTAPE 5/10: Création structure projet..."

mkdir -p src/lib
mkdir -p "src/app/(client)/intake/[dossierId]"
mkdir -p "src/app/(client)/payment"
mkdir -p "src/app/(client)/confirmation"
mkdir -p "src/app/(avocat)/login"
mkdir -p "src/app/(avocat)/dashboard/[id]"
mkdir -p src/app/api/geolocation
mkdir -p src/app/api/upload
mkdir -p src/app/api/rag/query
mkdir -p src/app/api/payment/create
mkdir -p src/app/api/webhook/stripe
mkdir -p src/app/api/cron/purge
mkdir -p src/app/api/analyse/dossier
mkdir -p src/components/client
mkdir -p src/components/avocat

echo "✅ Structure créée"

# ============================================
# ÉTAPE 6: COMMIT NETTOYAGE
# ============================================
echo ""
echo "💾 ÉTAPE 6/10: Commit nettoyage..."

git add .
git commit -m "🧹 Nettoyage: Suppression flashcards + création structure"

echo "✅ Commit nettoyage effectué"

# ============================================
# ÉTAPE 7: COPIE FICHIERS DEPUIS /mnt/user-data/outputs
# ============================================
echo ""
echo "📋 ÉTAPE 7/10: Copie des fichiers conformes..."

# Note: Les fichiers doivent être copiés manuellement depuis les livrables
echo "⚠️  Action manuelle requise:"
echo "   1. Copier schema-lexia.prisma → prisma/schema.prisma"
echo "   2. Copier les services .ts → src/lib/"
echo "   3. Copier render-lexia.yaml → render.yaml"

# ============================================
# ÉTAPE 8: CRÉATION .ENV.EXAMPLE
# ============================================
echo ""
echo "⚙️  ÉTAPE 8/10: Création .env.example..."

cat > .env.example << 'EOF'
# ==================================================
# VARIABLES D'ENVIRONNEMENT - Plateforme Divorce
# ==================================================

# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""

# Email
RESEND_API_KEY="re_7dfNr1yU_ZukPWHq1xoPGC5ty7jp86iu4"

# Géolocalisation
IPSTACK_KEY="9f3eec89f27d31fb1e6b3943d3e2c4de"

# Sécurité
CRON_SECRET=""
EOF

echo "✅ .env.example créé"

# ============================================
# ÉTAPE 9: COMMIT STRUCTURE
# ============================================
echo ""
echo "💾 ÉTAPE 9/10: Commit structure..."

git add .
git commit -m "🏗️ Structure projet conforme + dépendances"

echo "✅ Commit structure effectué"

# ============================================
# ÉTAPE 10: PUSH
# ============================================
echo ""
echo "🚀 ÉTAPE 10/10: Push vers GitHub..."

git push origin divorce-platform-migration

echo ""
echo "✅ Migration terminée avec succès!"
echo ""
echo "📋 Prochaines étapes manuelles:"
echo "   1. Copier les fichiers depuis les livrables"
echo "   2. Remplacer prisma/schema.prisma"
echo "   3. Copier les services dans src/lib/"
echo "   4. Commit et push les fichiers copiés"
echo "   5. Créer Pull Request: divorce-platform-migration → main"
echo ""
echo "🔗 Branche créée: divorce-platform-migration"
echo "🔗 Backup sauvegardé: $BACKUP_BRANCH"
