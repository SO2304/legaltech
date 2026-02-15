# 📘 Configuration Supabase Phase 2 - Guide Rapide

**Configuration simple du Storage bucket `documents` avec RLS**

---

## 🎯 Objectif

Configurer le bucket Supabase Storage pour stocker les documents clients (pièces d'identité, actes de mariage, bulletins de salaire, etc.) avec sécurité RLS.

---

## 📋 Étapes

### Étape 1 : Créer le bucket `documents`

1. Ouvrir **Supabase Dashboard**
2. Menu latéral → **Storage**
3. Cliquer sur **New bucket**
4. Configuration :
   ```
   Name: documents
   Public bucket: NON (décoché)
   File size limit: 10485760 (10 MB)
   Allowed MIME types:
     - image/*
     - application/pdf
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
   ```
5. Cliquer sur **Create bucket**

---

### Étape 2 : Appliquer les policies RLS

1. Menu latéral → **SQL Editor**
2. Cliquer sur **New query**
3. Copier-coller le contenu du fichier `SUPABASE_PHASE2_SIMPLE.sql` :

```sql
-- Lecture: utilisateurs authentifiés seulement
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
USING (auth.role() = 'authenticated');

-- Écriture: service role seulement (API routes Next.js)
CREATE POLICY "Service role can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'service_role');
```

4. Cliquer sur **Run** (ou Ctrl+Enter)

---

### Étape 3 : Vérifier la configuration

Exécuter dans SQL Editor :

```sql
-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'documents';

-- Vérifier les policies
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
```

**Résultats attendus** :
- ✅ 1 bucket nommé `documents` avec `public = false`
- ✅ 2 policies créées sur `storage.objects`

---

## 🔐 Modèle de sécurité

### Qui peut faire quoi ?

| Rôle | Lecture (SELECT) | Écriture (INSERT) |
|------|------------------|-------------------|
| **authenticated** (users) | ✅ Oui | ❌ Non |
| **service_role** (API) | ✅ Oui | ✅ Oui |
| **anon** (public) | ❌ Non | ❌ Non |

### Pourquoi cette configuration ?

- **Lecture par authenticated** : Les utilisateurs connectés peuvent télécharger leurs propres documents
- **Écriture par service_role uniquement** : Seules les API routes Next.js peuvent uploader (empêche les uploads directs non validés depuis le frontend)
- **Bucket privé** : Aucun accès public, requiert authentification

---

## 🧪 Test de la configuration

### Test 1 : Upload depuis API route (doit réussir)

Dans votre API route Next.js (`src/app/api/upload/route.ts`) :

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role = autorisé
)

const { data, error } = await supabaseAdmin.storage
  .from('documents')
  .upload(`${dossierId}/${file.name}`, file)

if (error) {
  console.error('❌ Erreur upload:', error)
} else {
  console.log('✅ Upload réussi:', data)
}
```

### Test 2 : Lecture depuis frontend (doit réussir)

Dans votre composant React (`src/components/client/DocumentUploader.tsx`) :

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

const { data, error } = await supabase.storage
  .from('documents')
  .download(`${dossierId}/document.pdf`)

if (error) {
  console.error('❌ Erreur download:', error)
} else {
  console.log('✅ Download réussi')
}
```

### Test 3 : Upload depuis frontend (doit échouer)

```typescript
// Ceci doit échouer avec une erreur de permission
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`test.pdf`, file)

// Erreur attendue: "new row violates row-level security policy"
console.log('❌ Upload direct interdit (attendu):', error)
```

---

## 🛠️ Troubleshooting

### Problème : "Bucket not found"

**Cause** : Le bucket 'documents' n'existe pas

**Solution** :
```sql
-- Vérifier les buckets existants
SELECT * FROM storage.buckets;

-- Si absent, créer via Dashboard ou SQL
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;
```

### Problème : "new row violates row-level security policy"

**Cause** : Tentative d'upload sans service_role

**Solution** : Assurez-vous d'utiliser `SUPABASE_SERVICE_ROLE_KEY` dans vos API routes, pas `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Problème : "Policy already exists"

**Cause** : Les policies ont déjà été créées

**Solution** :
```sql
-- Supprimer les policies existantes si besoin
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload documents" ON storage.objects;

-- Puis recréer
```

---

## 📝 Variables d'environnement requises

Dans votre fichier `.env.local` :

```env
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase (private - API routes only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic (OCR)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

⚠️ **IMPORTANT** : Ne JAMAIS exposer `SUPABASE_SERVICE_ROLE_KEY` au frontend !

---

## ✅ Checklist finale

Avant de tester l'upload de documents :

- [ ] Bucket `documents` créé dans Supabase Storage
- [ ] Bucket configuré en **privé** (public = false)
- [ ] Taille max : 10 MB
- [ ] MIME types : image/*, PDF, DOCX
- [ ] 2 policies RLS créées et vérifiées
- [ ] Variables d'environnement configurées
- [ ] `SUPABASE_SERVICE_ROLE_KEY` utilisée côté serveur uniquement

---

**🎉 Configuration terminée !**

Vous pouvez maintenant tester l'upload de documents depuis la page `/intake/[dossierId]`.
