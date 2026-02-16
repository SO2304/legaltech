-- ============================================
-- SUPABASE CONFIGURATION - PHASE 2
-- LegalTech Divorce Platform
-- Document Storage & Security Policies
-- ============================================

-- ============================================
-- 1. STORAGE BUCKET CREATION
-- ============================================
-- Execute this in Supabase Dashboard > Storage
-- Or via SQL Editor

-- Create 'documents' bucket for storing client documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket (requires authentication)
  52428800, -- 50 MB max file size (50 * 1024 * 1024)
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' -- DOCX
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES - SELECT (Download)
-- ============================================

-- Policy: Allow authenticated users to view their own dossier documents
CREATE POLICY "Users can view documents from their dossiers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    -- Extract dossierId from path (format: dossierId/filename.ext)
    (storage.foldername(name))[1] IN (
      SELECT d.id::text
      FROM "Dossier" d
      WHERE d."clientId" = auth.uid()::text
    )
  )
);

-- Policy: Service role can view all documents (for admin/cron jobs)
CREATE POLICY "Service role can view all documents"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'documents');

-- ============================================
-- 3. STORAGE POLICIES - INSERT (Upload)
-- ============================================

-- Policy: Allow authenticated users to upload to their own dossiers
CREATE POLICY "Users can upload documents to their dossiers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    -- Extract dossierId from path (format: dossierId/filename.ext)
    (storage.foldername(name))[1] IN (
      SELECT d.id::text
      FROM "Dossier" d
      WHERE d."clientId" = auth.uid()::text
    )
  )
);

-- Policy: Service role can upload anywhere (for system operations)
CREATE POLICY "Service role can upload all documents"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'documents');

-- ============================================
-- 4. STORAGE POLICIES - UPDATE
-- ============================================

-- Policy: Users cannot update existing files (immutable documents)
-- Only service role can update for system operations

CREATE POLICY "Service role can update documents"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- ============================================
-- 5. STORAGE POLICIES - DELETE
-- ============================================

-- Policy: Users cannot delete documents (only via RGPD purge)
-- Only service role can delete (for purge cron job)

CREATE POLICY "Service role can delete documents"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'documents');

-- ============================================
-- 6. DATABASE RLS POLICIES - Dossier
-- ============================================

-- Enable RLS on Dossier table
ALTER TABLE "Dossier" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own dossiers
CREATE POLICY "Users can view their own dossiers"
ON "Dossier"
FOR SELECT
TO authenticated
USING (
  "clientId" = auth.uid()::text
  OR "clientId" IN (
    SELECT id::text FROM "Client" WHERE "userId" = auth.uid()::text
  )
);

-- Policy: Users can insert their own dossiers
CREATE POLICY "Users can create their own dossiers"
ON "Dossier"
FOR INSERT
TO authenticated
WITH CHECK (
  "clientId" = auth.uid()::text
  OR "clientId" IN (
    SELECT id::text FROM "Client" WHERE "userId" = auth.uid()::text
  )
);

-- Policy: Users can update their own non-validated dossiers
CREATE POLICY "Users can update their own pending dossiers"
ON "Dossier"
FOR UPDATE
TO authenticated
USING (
  (
    "clientId" = auth.uid()::text
    OR "clientId" IN (
      SELECT id::text FROM "Client" WHERE "userId" = auth.uid()::text
    )
  )
  AND "statut" = 'EN_ATTENTE'
)
WITH CHECK (
  (
    "clientId" = auth.uid()::text
    OR "clientId" IN (
      SELECT id::text FROM "Client" WHERE "userId" = auth.uid()::text
    )
  )
  AND "statut" = 'EN_ATTENTE'
);

-- Policy: Service role has full access (for admin/cron jobs)
CREATE POLICY "Service role has full access to dossiers"
ON "Dossier"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 7. DATABASE RLS POLICIES - Document
-- ============================================

-- Enable RLS on Document table
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view documents from their dossiers
CREATE POLICY "Users can view their dossier documents"
ON "Document"
FOR SELECT
TO authenticated
USING (
  "dossierId" IN (
    SELECT id FROM "Dossier"
    WHERE "clientId" = auth.uid()::text
    OR "clientId" IN (
      SELECT id::text FROM "Client" WHERE "userId" = auth.uid()::text
    )
  )
);

-- Policy: Users can insert documents to their dossiers
CREATE POLICY "Users can upload documents to their dossiers"
ON "Document"
FOR INSERT
TO authenticated
WITH CHECK (
  "dossierId" IN (
    SELECT id FROM "Dossier"
    WHERE "clientId" = auth.uid()::text
    OR "clientId" IN (
      SELECT id::text FROM "Client" WHERE "userId" = auth.uid()::text
    )
  )
);

-- Policy: Users can delete documents from their pending dossiers
CREATE POLICY "Users can delete documents from pending dossiers"
ON "Document"
FOR DELETE
TO authenticated
USING (
  "dossierId" IN (
    SELECT id FROM "Dossier"
    WHERE (
      "clientId" = auth.uid()::text
      OR "clientId" IN (
        SELECT id::text FROM "Client" WHERE "userId" = auth.uid()::text
      )
    )
    AND "statut" = 'EN_ATTENTE'
  )
);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to documents"
ON "Document"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 8. DATABASE RLS POLICIES - Client
-- ============================================

-- Enable RLS on Client table
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own client profile
CREATE POLICY "Users can view their own profile"
ON "Client"
FOR SELECT
TO authenticated
USING (
  "userId" = auth.uid()::text
  OR id = auth.uid()::text
);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create their own profile"
ON "Client"
FOR INSERT
TO authenticated
WITH CHECK (
  "userId" = auth.uid()::text
  OR id = auth.uid()::text
);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON "Client"
FOR UPDATE
TO authenticated
USING (
  "userId" = auth.uid()::text
  OR id = auth.uid()::text
)
WITH CHECK (
  "userId" = auth.uid()::text
  OR id = auth.uid()::text
);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to clients"
ON "Client"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 9. HELPER FUNCTIONS (Optional)
-- ============================================

-- Function: Get dossier owner userId from document path
CREATE OR REPLACE FUNCTION get_dossier_owner(dossier_id TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT "clientId"::text
  FROM "Dossier"
  WHERE id = dossier_id::uuid
  LIMIT 1;
$$;

-- Function: Check if user owns dossier
CREATE OR REPLACE FUNCTION user_owns_dossier(dossier_id TEXT, user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "Dossier" d
    WHERE d.id = dossier_id::uuid
    AND (
      d."clientId" = user_id
      OR d."clientId" IN (
        SELECT c.id::text
        FROM "Client" c
        WHERE c."userId" = user_id
      )
    )
  );
$$;

-- ============================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================

-- Index on clientId for fast dossier lookups
CREATE INDEX IF NOT EXISTS idx_dossier_clientid ON "Dossier"("clientId");

-- Index on dossierId for fast document lookups
CREATE INDEX IF NOT EXISTS idx_document_dossierid ON "Document"("dossierId");

-- Index on userId for fast client lookups
CREATE INDEX IF NOT EXISTS idx_client_userid ON "Client"("userId");

-- Index on statut for filtering dossiers
CREATE INDEX IF NOT EXISTS idx_dossier_statut ON "Dossier"("statut");

-- Index on datePurge for purge cron job
CREATE INDEX IF NOT EXISTS idx_dossier_datepurge ON "Dossier"("datePurge") WHERE "isPurged" = false;

-- Index on isPurged for queries
CREATE INDEX IF NOT EXISTS idx_dossier_ispurged ON "Dossier"("isPurged");

-- Index on stripePaid for filtering paid dossiers
CREATE INDEX IF NOT EXISTS idx_dossier_stripepaid ON "Dossier"("stripePaid");

-- ============================================
-- 11. TRIGGERS (Optional - Audit Trail)
-- ============================================

-- Function: Update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- Trigger: Auto-update updatedAt on Dossier
CREATE TRIGGER update_dossier_updated_at
BEFORE UPDATE ON "Dossier"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger: Auto-update updatedAt on Document
CREATE TRIGGER update_document_updated_at
BEFORE UPDATE ON "Document"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger: Auto-update updatedAt on Client
CREATE TRIGGER update_client_updated_at
BEFORE UPDATE ON "Client"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';

-- Verify policies are active
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Dossier';
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Document';
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Client';

-- ============================================
-- NOTES
-- ============================================

/*
1. BUCKET CONFIGURATION:
   - Name: 'documents'
   - Public: false (private, requires auth)
   - Max file size: 50 MB
   - Allowed types: JPEG, PNG, WEBP, PDF, DOCX

2. SECURITY MODEL:
   - Users can only access their own dossiers/documents
   - Service role has full access (for admin/cron operations)
   - Documents are immutable (no user updates)
   - Only service role can delete (RGPD purge)

3. PATH STRUCTURE:
   - Format: documents/{dossierId}/{filename}.{ext}
   - Example: documents/550e8400-e29b-41d4-a716-446655440000/piece_identite.pdf

4. PERFORMANCE:
   - Indexes on foreign keys (clientId, dossierId, userId)
   - Indexes on filter fields (statut, isPurged, stripePaid)
   - Composite index on datePurge + isPurged for purge cron

5. AUDIT TRAIL:
   - Auto-update updatedAt on all tables
   - Preserved in Prisma schema timestamps
   - RGPD purge logs in application layer

6. EXECUTION ORDER:
   - Run in Supabase SQL Editor
   - Execute sections 1-11 sequentially
   - Verify with queries at the end
*/
