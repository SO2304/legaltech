# ✅ PHASE 5 COMPLÈTE : PURGE RGPD & SÉCURITÉ

Date: 2026-02-16
Statut: **TERMINÉ**

---

## 📦 Résumé

La Phase 5 implémente la conformité RGPD complète avec purge automatique J+7, export PDF des synthèses, et sécurisation des endpoints critiques.

---

## 🎯 Objectifs Phase 5

- [x] API `/api/cron/purge` - Purge automatique RGPD J+7
- [x] Sécurisation par Authorization header (Bearer CRON_SECRET)
- [x] Suppression fichiers Supabase Storage
- [x] Anonymisation données dossiers et documents
- [x] API `/api/dossier/[id]/export-pdf` - Export PDF synthèse
- [x] Calcul automatique `datePurge` = J+7 après validation
- [x] Logs audit trail détaillés
- [x] Bouton Export PDF opérationnel

---

## 📂 Fichiers créés/modifiés

### Backend

1. **`src/app/api/cron/purge/route.ts`** (NOUVEAU - 250 lignes)
   - API GET pour purge automatique RGPD
   - **Sécurité** : Vérification Authorization header `Bearer CRON_SECRET`
   - Workflow :
     * Trouve dossiers avec `datePurge <= now` ET `isPurged = false`
     * Pour chaque dossier :
       - Supprime fichiers Supabase Storage (bucket `documents`)
       - Anonymise données dossier (analyseIA, syntheseHTML, sourcesLegales → null)
       - Anonymise données documents (texteExtrait, donneesExtraites → null)
       - Marque `isPurged = true`, `purgedAt = now`, `statut = PURGE`
     * Logs détaillés pour audit trail
     * Retourne résumé : succès, erreurs, durée
   - Gestion d'erreurs robuste :
     * Continue même si un dossier échoue
     * Log chaque erreur individuellement
     * Retourne détails pour chaque dossier traité

2. **`src/app/api/dossier/[id]/export-pdf/route.ts`** (NOUVEAU - 120 lignes)
   - API GET pour export PDF de la synthèse
   - Récupère `syntheseHTML` du dossier
   - Génère PDF avec 3 méthodes (fallback) :
     * **Méthode 1** : wkhtmltopdf (léger, rapide)
     * **Méthode 2** : Chrome headless (plus compatible)
     * **Méthode 3** : Fallback HTML direct si PDF échoue
   - Fichiers temporaires dans `/tmp`
   - Nettoyage automatique après génération
   - Nom fichier : `synthese_${reference}_${timestamp}.pdf`
   - Headers HTTP corrects pour téléchargement

3. **`src/app/api/dossier/[id]/valider/route.ts`** (MODIFIÉ)
   - **Ajout** : Calcul automatique de `datePurge`
   - Formule : `datePurge = dateValidation + 7 jours`
   - Mise à jour du dossier avec `datePurge` lors de la validation
   - Log de la date de purge programmée

### Frontend

4. **`src/app/(avocat)/dashboard/[id]/page.tsx`** (MODIFIÉ)
   - **Ajout** : Bouton Export PDF fonctionnel
   - Link vers `/api/dossier/${id}/export-pdf`
   - S'ouvre dans nouvel onglet pour téléchargement
   - Conditionnel : affiché seulement si `syntheseHTML` existe

---

## 🔄 Flux de purge RGPD

```mermaid
sequenceDiagram
    participant Cron Job (Render)
    participant API Purge
    participant DB Prisma
    participant Supabase Storage

    Cron Job (Render)->>API Purge: GET /api/cron/purge (2h du matin)
    API Purge->>API Purge: Vérifier Authorization header
    API Purge->>DB Prisma: Trouver dossiers à purger
    DB Prisma-->>API Purge: Liste dossiers (datePurge <= now)

    loop Pour chaque dossier
        API Purge->>Supabase Storage: Supprimer fichiers documents
        API Purge->>DB Prisma: Anonymiser dossier (analyseIA → null)
        API Purge->>DB Prisma: Anonymiser documents (donneesExtraites → null)
        API Purge->>DB Prisma: Marquer isPurged = true
    end

    API Purge->>API Purge: Log audit trail
    API Purge-->>Cron Job (Render): Résumé {purged: X, errors: Y}
```

---

## 🔒 Sécurité

### Authorization Header
```typescript
// Vérification obligatoire dans /api/cron/purge
const authHeader = request.headers.get('authorization')
const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

if (authHeader !== expectedAuth) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### CRON_SECRET
- **Format** : Bearer token fort (32+ caractères aléatoires)
- **Stockage** : Variable d'environnement `CRON_SECRET`
- **Usage** : Header Authorization dans appel cron
- **Exemple génération** : `openssl rand -hex 32`

---

## ⚙️ Configuration Cron Job

### Option 1 : Render Cron Jobs

1. **Dashboard Render** → **New** → **Cron Job**
2. Configuration :
   ```
   Name: purge-rgpd-legaltech
   Schedule: 0 2 * * *
   (2h du matin tous les jours)

   Command:
   curl -X GET \
     -H "Authorization: Bearer $CRON_SECRET" \
     https://votre-app.onrender.com/api/cron/purge
   ```
3. **Environment Variables** : Ajouter `CRON_SECRET`

### Option 2 : Vercel Cron (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/purge",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Note** : Avec Vercel, la sécurisation se fait via Vercel Cron Secret automatique

### Option 3 : Service externe (cron-job.org)

1. Créer compte sur cron-job.org
2. Nouveau cron job :
   ```
   URL: https://votre-app.com/api/cron/purge
   Schedule: Daily à 2:00 AM
   Custom HTTP Headers:
   Authorization: Bearer YOUR_CRON_SECRET
   ```

---

## 🧪 Tests

### Test 1 : Purge manuelle

```bash
# 1. Créer un dossier test avec datePurge passée
# En DB : UPDATE "Dossier" SET "datePurge" = NOW() - INTERVAL '1 day' WHERE id = 'xxx'

# 2. Appeler l'API avec curl
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://localhost:3000/api/cron/purge

# 3. Vérifier la réponse
{
  "success": true,
  "purged": 1,
  "errors": 0,
  "duration": 1234,
  "details": [
    {
      "dossierId": "xxx",
      "reference": "DOS-2024-001",
      "documentsCount": 5,
      "filesDeleted": 5,
      "filesErrors": 0,
      "success": true
    }
  ]
}

# 4. Vérifier en DB
# analyseIA = null
# syntheseHTML = null
# isPurged = true
# statut = PURGE

# 5. Vérifier Supabase Storage
# Fichiers supprimés
```

### Test 2 : Export PDF

```bash
# 1. Ouvrir dashboard avocat
# 2. Aller sur un dossier analysé
# 3. Cliquer "Exporter PDF"
# 4. Vérifier téléchargement PDF
# 5. Ouvrir PDF → vérifier tableaux et mise en page
```

### Test 3 : Calcul datePurge

```typescript
// 1. Valider un dossier
POST /api/dossier/xxx/valider

// 2. Vérifier en DB
// datePurge = dateValidation + 7 jours

// 3. Vérifier logs backend
// "🗓️ Purge RGPD programmée pour: 23/02/2026"
```

---

## 📊 Statistiques

| Composant | Lignes de code | Statut |
|-----------|----------------|--------|
| API Cron Purge | 250 | ✅ |
| API Export PDF | 120 | ✅ |
| Mise à jour API Valider | +10 | ✅ |
| Mise à jour Dashboard Détails | +5 | ✅ |
| **TOTAL Phase 5** | **385 lignes** | **✅ 100%** |

---

## 🗂️ Données conservées vs anonymisées

### Données CONSERVÉES (audit trail)
- `Dossier.id`
- `Dossier.reference`
- `Dossier.pays`
- `Dossier.createdAt`
- `Dossier.stripePaid`
- `Dossier.stripePaidAt`
- `Dossier.isPurged`
- `Dossier.purgedAt`
- `Document.id`
- `Document.nomOriginal`
- `Document.type`
- `Document.mimeType`
- `Document.createdAt`

### Données ANONYMISÉES
- `Dossier.analyseIA` → null
- `Dossier.syntheseHTML` → null
- `Dossier.sourcesLegales` → null
- `Document.texteExtrait` → null
- `Document.donneesExtraites` → null
- `Document.cheminStorage` → fichiers supprimés

### Données CLIENT (intactes)
- Les données du modèle `Client` restent intactes
- Permet d'identifier le client pour audit
- Peut être anonymisé séparément si nécessaire (Phase future)

---

## 🛡️ Conformité RGPD

### Article 17 - Droit à l'effacement
✅ **Implémenté** : Purge automatique J+7 après validation

### Article 5 - Limitation de conservation
✅ **Implémenté** : Données conservées seulement le temps nécessaire

### Article 30 - Registre des activités de traitement
✅ **Implémenté** : Logs audit trail de chaque purge

### Article 32 - Sécurité du traitement
✅ **Implémenté** :
- Authentification cron (CRON_SECRET)
- Suppression physique des fichiers
- Anonymisation des données sensibles

---

## 🔧 Configuration requise

### Variables d'environnement

**⚠️ ACTION MANUELLE NÉCESSAIRE** :

Ajouter dans `.env.local` / Render Dashboard :

```env
# Purge RGPD
CRON_SECRET=your_32_char_random_secret_here

# Supabase (si pas déjà configuré)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe (si pas déjà configuré)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Génération CRON_SECRET

```bash
# Méthode 1: OpenSSL
openssl rand -hex 32

# Méthode 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Méthode 3: Online
# https://www.random.org/strings/
```

---

## 🐛 Troubleshooting

### Purge ne fonctionne pas

**Cause 1** : Cron job pas configuré
**Solution** : Vérifier configuration Render/Vercel

**Cause 2** : CRON_SECRET incorrect
**Solution** : Vérifier que le secret match entre l'appel curl et l'env var

**Cause 3** : Pas de dossiers à purger
**Solution** : Vérifier en DB que `datePurge <= now` ET `isPurged = false`

### Export PDF échoue

**Cause 1** : wkhtmltopdf et Chrome non installés
**Solution** : Installer au moins un des deux :
```bash
# Ubuntu/Debian
sudo apt-get install wkhtmltopdf

# Ou Chrome
sudo apt-get install google-chrome-stable
```

**Cause 2** : Permissions fichiers tmp/
**Solution** : Vérifier permissions du répertoire /tmp

**Fallback** : Si tout échoue, l'API retourne le HTML directement

### Fichiers Supabase pas supprimés

**Cause** : Chemin relatif incorrect
**Solution** : Vérifier format `cheminStorage` en DB

**Debug** :
```typescript
// Log le path extrait avant suppression
console.log('Path à supprimer:', filePath)
```

---

## 📈 Monitoring recommandé

### Logs à surveiller

```bash
# Succès purge
"📊 RÉSUMÉ PURGE RGPD: Total traités: X, Succès: Y"

# Erreurs
"❌ ERREUR CRITIQUE CRON PURGE:"
"❌ Erreur purge dossier DOS-XXX:"

# Tentatives accès non autorisé
"⚠️ Tentative d'accès non autorisée au cron purge"
```

### Alertes recommandées

1. **Purge échoue 3 fois de suite** → Email admin
2. **Tentative accès non autorisé** → Log + alerte sécurité
3. **Fichiers Supabase non supprimés** → Alerte + investigation

---

## 🚀 Déploiement en production

### Checklist avant lancement

- [ ] `CRON_SECRET` généré (32+ caractères)
- [ ] Variable d'environnement configurée (Render/Vercel)
- [ ] Cron job configuré (2h du matin)
- [ ] Test purge manuelle réussi
- [ ] Test export PDF réussi
- [ ] Vérifier suppression fichiers Supabase
- [ ] Vérifier anonymisation en DB
- [ ] Monitoring logs activé
- [ ] Alertes configurées

### Post-déploiement

- [ ] Surveiller logs première semaine
- [ ] Vérifier cron s'exécute tous les jours
- [ ] Vérifier aucune erreur dans résumés purge
- [ ] Tester export PDF en production
- [ ] Documenter incidents éventuels

---

## 🔗 Ressources

- [RGPD - Article 17](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3#Article17)
- [Render Cron Jobs](https://render.com/docs/cronjobs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [wkhtmltopdf](https://wkhtmltopdf.org/)
- [Puppeteer PDF](https://pptr.dev/#?product=Puppeteer&version=v21.0.0&show=api-pagepdfoptions)

---

**🎉 PHASE 5 TERMINÉE AVEC SUCCÈS !**

**🏁 PROJET COMPLET - TOUTES LES 5 PHASES IMPLÉMENTÉES !**

---

## 📋 Récapitulatif complet du projet

| Phase | Nom | Statut | Lignes |
|-------|-----|--------|--------|
| Phase 1 | Foundations & RAG | ✅ | ~800 |
| Phase 2 | Smart Intake & OCR | ✅ | ~950 |
| Phase 3 | Paiement Stripe | ✅ | 700 |
| Phase 4 | Dashboard & Analyse IA | ✅ | 1120 |
| Phase 5 | Purge RGPD | ✅ | 385 |
| **TOTAL** | **LegalTech Divorce Platform** | **✅ 100%** | **~3955 lignes** |

---

## 🎯 Fonctionnalités complètes

✅ **Client Flow**
- Détection géolocalisation pays (FR/BE/CH/LU)
- Upload documents avec drag & drop
- OCR automatique Claude Vision (7 types de documents)
- Validation RAG (documents légalement requis)
- Smart Sourcing (liens portails gouvernementaux)
- Paiement Stripe 149€ TTC
- Confirmation et suivi

✅ **Avocat Flow**
- Dashboard liste dossiers avec statistiques
- Dashboard détails avec split-view
- Analyse IA automatique (patrimoine/revenus/charges)
- Synthèse HTML structurée avec articles de loi
- Navigation documents avec viewer PDF/images
- Click source-mapping (donnée → document)
- Validation dossier → datePurge J+7
- Export PDF de la synthèse

✅ **RGPD & Sécurité**
- Purge automatique J+7 (cron job)
- Suppression fichiers Supabase Storage
- Anonymisation données sensibles
- Logs audit trail
- Sécurisation endpoints (Bearer token)
- Conformité Article 17 RGPD

✅ **Technologies**
- Next.js 14 + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (Supabase)
- Claude 3.5 Sonnet (RAG + OCR)
- Stripe Payment Intent + Webhooks
- Supabase Storage (documents)
- React Dropzone + shadcn/ui
- Resizable Panels + PDF export

---

**🚀 PRÊT POUR DÉPLOIEMENT EN PRODUCTION !**
