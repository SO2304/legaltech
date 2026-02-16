-- ============================================
-- CONFIGURATION SUPABASE - PHASE 2
-- Configuration simple Storage bucket + RLS
-- ============================================

-- ⚠️ CRÉATION DU BUCKET (via Dashboard Supabase)
-- Aller dans Storage > Create bucket
-- Configuration:
--   Nom: documents
--   Public: NON
--   Allowed MIME types: image/*, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
--   Max file size: 10 MB


-- ============================================
-- POLICIES RLS (Row Level Security)
-- À exécuter dans SQL Editor
-- ============================================

-- Lecture: utilisateurs authentifiés seulement
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
USING (auth.role() = 'authenticated');

-- Écriture: service role seulement (API routes Next.js)
CREATE POLICY "Service role can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'service_role');


-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'documents';

-- Vérifier les policies
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
