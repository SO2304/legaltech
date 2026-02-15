# 📘 Guide Configuration Supabase - Phase 2

**LegalTech Divorce Platform**
Configuration complète du Storage et des politiques RLS

---

## 📋 Vue d'ensemble

Ce guide vous accompagne dans la configuration complète de Supabase pour la Phase 2 :
- **Storage Bucket** pour les documents clients
- **Row Level Security (RLS)** pour la sécurité des données
- **Policies** pour contrôler l'accès aux fichiers
- **Indexes** pour optimiser les performances

---

## 🎯 Prérequis

- [ ] Compte Supabase actif
- [ ] Projet Supabase créé
- [ ] Base de données Prisma migrée (schéma appliqué)
- [ ] Clés API Supabase disponibles :
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## 🚀 Méthode 1 : Configuration via SQL Editor (Recommandé)

### Étape 1 : Accéder au SQL Editor

1. Ouvrez votre projet Supabase
2. Menu latéral → **SQL Editor**
3. Cliquez sur **New Query**

### Étape 2 : Exécuter le script SQL

1. Ouvrez le fichier `docs/SUPABASE_PHASE2_SETUP.sql`
2. Copiez tout le contenu
3. Collez dans le SQL Editor
4. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 3 : Vérifier l'exécution

**Vérifications à faire** :

```sql
-- 1. Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'documents';

-- 2. Vérifier les policies storage
SELECT * FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Vérifier les policies Dossier
SELECT * FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'Dossier';

-- 4. Vérifier les indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('Dossier', 'Document', 'Client');
```

**Résultats attendus** :
- ✅ 1 bucket nommé `documents`
- ✅ 6+ policies sur storage.objects
- ✅ 4+ policies sur Dossier
- ✅ 4+ policies sur Document
- ✅ 3+ policies sur Client
- ✅ 8+ indexes créés

---

## 🖱️ Méthode 2 : Configuration via Dashboard (Alternative)

Si vous préférez utiliser l'interface graphique :

### A. Créer le Storage Bucket

1. **Storage** → **Create a new bucket**
2. Configuration :
   ```
   Name: documents
   Public bucket: NO (décoché)
   File size limit: 52428800 (50 MB)
   Allowed MIME types:
     - image/jpeg
     - image/jpg
     - image/png
     - image/webp
     - application/pdf
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
   ```
3. **Create bucket**

### B. Configurer les Storage Policies

1. **Storage** → **Policies** → **documents**
2. Cliquez sur **New Policy** pour chaque politique :

**Policy 1 : SELECT - Users can view their documents**
```sql
-- Policy name: Users can view documents from their dossiers
-- Target roles: authenticated
-- Operation: SELECT

bucket_id = 'documents'
AND (
  (storage.foldername(name))[1] IN (
    SELECT d.id::text
    FROM "Dossier" d
    WHERE d."clientId" = auth.uid()::text
  )
)
```

**Policy 2 : INSERT - Users can upload to their dossiers**
```sql
-- Policy name: Users can upload documents to their dossiers
-- Target roles: authenticated
-- Operation: INSERT

bucket_id = 'documents'
AND (
  (storage.foldername(name))[1] IN (
    SELECT d.id::text
    FROM "Dossier" d
    WHERE d."clientId" = auth.uid()::text
  )
)
```

**Policy 3 : DELETE - Service role only**
```sql
-- Policy name: Service role can delete documents
-- Target roles: service_role
-- Operation: DELETE

bucket_id = 'documents'
```

### C. Activer RLS sur les tables

1. **Authentication** → **Policies** → onglet **Tables**
2. Pour chaque table (`Dossier`, `Document`, `Client`) :
   - Cliquez sur le menu ⋮
   - **Enable RLS**

### D. Créer les RLS Policies

Exécutez les sections 6, 7, 8 du fichier SQL via **SQL Editor** pour créer toutes les policies RLS sur les tables.

---

## 🧪 Tests de validation

### Test 1 : Upload de fichier (via frontend)

```typescript
// Test dans votre application Next.js
const testUpload = async () => {
  const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(`${dossierId}/test.pdf`, file)

  if (error) {
    console.error('❌ Erreur upload:', error)
  } else {
    console.log('✅ Upload réussi:', data)
  }
}
```

### Test 2 : Accès aux fichiers

```typescript
// Test lecture d'un fichier
const testDownload = async () => {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(`${dossierId}/test.pdf`)

  if (error) {
    console.error('❌ Erreur download:', error)
  } else {
    console.log('✅ Download réussi, taille:', data.size)
  }
}
```

### Test 3 : RLS sur Dossier

```sql
-- Connecté en tant qu'utilisateur (via supabase.auth)
-- Cette requête doit retourner UNIQUEMENT les dossiers de l'utilisateur

SELECT * FROM "Dossier";
```

### Test 4 : Tentative d'accès non autorisé

```typescript
// Essayer d'accéder au dossier d'un autre utilisateur
// Doit échouer avec une erreur de permission
const testUnauthorized = async () => {
  const otherUserDossierId = 'autre-uuid-ici'

  const { data, error } = await supabase.storage
    .from('documents')
    .list(`${otherUserDossierId}/`)

  // Doit retourner une erreur ou liste vide
  console.log('Résultat (doit être vide ou erreur):', data, error)
}
```

---

## 🔐 Sécurité : Vérifications importantes

### ✅ Checklist Sécurité

- [ ] **RLS activé** sur Dossier, Document, Client
- [ ] **Bucket privé** (public = false)
- [ ] **Policies restrictives** (utilisateurs ne voient que leurs données)
- [ ] **Service role protégé** (clé jamais exposée au frontend)
- [ ] **MIME types limités** (seulement PDF, images, DOCX)
- [ ] **Taille max 50 MB** configurée
- [ ] **Pas de politique "Allow all"** sur les tables sensibles
- [ ] **Indexes créés** pour performances

### ⚠️ Points de vigilance

1. **Ne JAMAIS exposer `SUPABASE_SERVICE_ROLE_KEY` au frontend**
   - Utilisez uniquement côté serveur (API routes)
   - Stockez dans variables d'environnement sécurisées

2. **Structure de path obligatoire**
   - Format : `documents/{dossierId}/{filename}.ext`
   - Le dossierId DOIT correspondre à un dossier appartenant à l'utilisateur

3. **Validation côté serveur**
   - Ne vous fiez pas uniquement aux RLS policies
   - Ajoutez des validations dans vos API routes Next.js

4. **Logs et monitoring**
   - Surveillez les tentatives d'accès non autorisées
   - Configurez des alertes sur les erreurs de permission

---

## 📊 Structure des données

### Path structure dans Storage

```
documents/
├── 550e8400-e29b-41d4-a716-446655440000/ (dossierId)
│   ├── piece_identite_recto.pdf
│   ├── piece_identite_verso.pdf
│   ├── contrat_mariage.pdf
│   ├── certificat_mariage.pdf
│   └── ...
├── 660e8400-e29b-41d4-a716-446655440001/ (autre dossierId)
│   └── ...
```

### Métadonnées en base de données

```typescript
// Document model (Prisma)
{
  id: "uuid",
  dossierId: "uuid", // FK vers Dossier
  nomOriginal: "piece_identite_recto.pdf",
  type: "PIECE_IDENTITE",
  cheminStorage: "https://xxx.supabase.co/storage/v1/object/public/documents/550e8400.../piece_identite_recto.pdf",
  texteExtrait: "...", // Résultat OCR
  donneesExtraites: {...} // JSON structuré
}
```

---

## 🛠️ Troubleshooting

### Problème : "new row violates row-level security policy"

**Cause** : RLS activé mais aucune policy ne permet l'opération
**Solution** :
```sql
-- Vérifier les policies existantes
SELECT * FROM pg_policies WHERE tablename = 'Dossier';

-- Temporairement désactiver RLS pour debug (DEV ONLY)
ALTER TABLE "Dossier" DISABLE ROW LEVEL SECURITY;
-- ... tester ...
ALTER TABLE "Dossier" ENABLE ROW LEVEL SECURITY;
```

### Problème : "permission denied for table"

**Cause** : Table n'est pas accessible par le role authenticated
**Solution** :
```sql
-- Donner les permissions nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON "Dossier" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Document" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "Client" TO authenticated;
```

### Problème : Upload échoue - "File size exceeds limit"

**Cause** : Fichier > 50 MB
**Solution** :
```sql
-- Augmenter la limite (si nécessaire)
UPDATE storage.buckets
SET file_size_limit = 104857600 -- 100 MB
WHERE id = 'documents';
```

### Problème : "Bucket not found"

**Cause** : Bucket 'documents' n'existe pas
**Solution** :
```sql
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;
```

### Problème : Policies trop permissives

**Diagnostic** :
```sql
-- Lister toutes les policies
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'Dossier';
```

**Solution** : Supprimer et recréer les policies restrictives :
```sql
-- Supprimer policy
DROP POLICY IF EXISTS "policy_name" ON "Dossier";

-- Recréer avec la bonne logique (voir SUPABASE_PHASE2_SETUP.sql)
```

---

## 🔄 Synchronisation avec Prisma

### Après modification du schéma Prisma

Si vous modifiez `prisma/schema.prisma` :

```bash
# 1. Créer une migration
npx prisma migrate dev --name add_new_field

# 2. Appliquer en production
npx prisma migrate deploy

# 3. Mettre à jour les RLS policies si nécessaire
# Exécuter les nouvelles policies dans Supabase SQL Editor
```

### Ajouter une nouvelle table avec RLS

```sql
-- 1. Activer RLS
ALTER TABLE "NouvelleTable" ENABLE ROW LEVEL SECURITY;

-- 2. Créer policies
CREATE POLICY "Users can view their own data"
ON "NouvelleTable"
FOR SELECT
TO authenticated
USING (
  "userId" = auth.uid()::text
);

-- 3. Donner permissions
GRANT SELECT, INSERT, UPDATE ON "NouvelleTable" TO authenticated;

-- 4. Créer index si nécessaire
CREATE INDEX idx_nouvelle_table_userid ON "NouvelleTable"("userId");
```

---

## 📈 Monitoring et Maintenance

### Vérification régulière

**Hebdomadaire** :
```sql
-- Vérifier le nombre de fichiers par bucket
SELECT bucket_id, COUNT(*) as file_count
FROM storage.objects
GROUP BY bucket_id;

-- Vérifier l'espace utilisé
SELECT bucket_id,
       COUNT(*) as files,
       SUM(metadata->>'size')::bigint / 1024 / 1024 as total_mb
FROM storage.objects
GROUP BY bucket_id;
```

**Mensuel** :
```sql
-- Vérifier les dossiers non purgés après datePurge
SELECT COUNT(*) as overdue_purges
FROM "Dossier"
WHERE "datePurge" < NOW()
AND "isPurged" = false;

-- Vérifier les anomalies de taille
SELECT id, "nomOriginal",
       (metadata->>'size')::bigint / 1024 / 1024 as size_mb
FROM storage.objects
WHERE bucket_id = 'documents'
AND (metadata->>'size')::bigint > 10485760 -- > 10 MB
ORDER BY size_mb DESC
LIMIT 20;
```

### Alertes recommandées

1. **Alerte espace disque** : Si espace > 80% de quota Supabase
2. **Alerte purge** : Si dossiers non purgés > 10 jours après datePurge
3. **Alerte sécurité** : Tentatives d'accès non autorisées > 100/jour
4. **Alerte performance** : Requêtes lentes > 1000ms

---

## 🎓 Ressources et références

### Documentation officielle

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Prisma avec Supabase](https://www.prisma.io/docs/guides/database/supabase)

### Exemples de code

- [Next.js + Supabase Auth](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)
- [Supabase Storage Upload](https://supabase.com/docs/reference/javascript/storage-from-upload)

### Outils utiles

- **Supabase CLI** : `npm install -g supabase`
- **Prisma Studio** : `npx prisma studio`
- **PostgreSQL Client** : psql, DBeaver, TablePlus

---

## ✅ Checklist finale

Avant de passer en production :

- [ ] Bucket 'documents' créé et configuré
- [ ] RLS activé sur Dossier, Document, Client
- [ ] Toutes les policies storage créées (6+)
- [ ] Toutes les policies RLS créées (11+)
- [ ] Indexes de performance créés (8+)
- [ ] Tests d'upload réussis
- [ ] Tests de download réussis
- [ ] Tests RLS validés (accès restreint)
- [ ] Service role key sécurisée (côté serveur uniquement)
- [ ] Monitoring configuré
- [ ] Documentation à jour

---

**🎉 Configuration Supabase Phase 2 terminée !**

Passez maintenant aux tests d'intégration avec votre application Next.js.

---

## 💡 Prochaines étapes

1. **Tester l'upload** de documents depuis le frontend
2. **Tester l'OCR** via API route `/api/ocr/process`
3. **Vérifier la validation RAG** des documents requis
4. **Tester le workflow complet** : Upload → OCR → Validation → Paiement
