-- =============================================================================
-- FIX RLS POLICIES FOR LEGAL DOSSIER
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS avocat_see_own_dossiers ON dossiers;
DROP POLICY IF EXISTS client_see_own_dossiers ON dossiers;
DROP POLICY IF EXISTS avocat_see_own_documents ON documents;

-- For development/demo, allow full access to all tables
-- (In production, you should implement proper auth)

-- Avocats table - allow all access
CREATE POLICY "avocats_full_access" ON avocats
  FOR ALL USING (true) WITH CHECK (true);

-- Clients table - allow all access  
CREATE POLICY "clients_full_access" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- Dossiers table - allow all access
CREATE POLICY "dossiers_full_access" ON dossiers
  FOR ALL USING (true) WITH CHECK (true);

-- Documents table - allow all access
CREATE POLICY "documents_full_access" ON documents
  FOR ALL USING (true) WITH CHECK (true);

-- Textes lois table - allow read access for everyone
CREATE POLICY "textes_lois_read_access" ON textes_lois
  FOR SELECT USING (true);

-- Confirm RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('avocats', 'clients', 'dossiers', 'documents', 'textes_lois');
