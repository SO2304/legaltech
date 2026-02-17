const { Client } = require('pg');

async function fixRLS() {
  const client = new Client({
    host: 'db.dyyvacebveqmrloriymr.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Zaza23042808',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, enable RLS on all tables
    const tables = ['avocats', 'clients', 'dossiers', 'documents', 'textes_lois'];
    
    for (const table of tables) {
      await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      console.log(`Enabled RLS on ${table}`);
    }

    // Drop all existing policies
    const policiesToDrop = [
      'avocat_see_own_dossiers', 'client_see_own_dossiers', 'avocat_see_own_documents',
      'avocats_full_access', 'clients_full_access', 'dossiers_full_access',
      'documents_full_access', 'textes_lois_read_access'
    ];

    for (const policy of policiesToDrop) {
      for (const table of tables) {
        try {
          await client.query(`DROP POLICY IF EXISTS "${policy}" ON "${table}"`);
        } catch (e) {}
      }
    }
    console.log('Dropped old policies');

    // Create permissive policies for development (allow all access)
    const policies = [
      { name: 'avocats_full_access', table: 'avocats', sql: `CREATE POLICY "avocats_full_access" ON avocados FOR ALL USING (true) WITH CHECK (true)` },
      { name: 'clients_full_access', table: 'clients', sql: `CREATE POLICY "clients_full_access" ON clients FOR ALL USING (true) WITH CHECK (true)` },
      { name: 'dossiers_full_access', table: 'dossiers', sql: `CREATE POLICY "dossiers_full_access" ON dossiers FOR ALL USING (true) WITH CHECK (true)` },
      { name: 'documents_full_access', table: 'documents', sql: `CREATE POLICY "documents_full_access" ON documents FOR ALL USING (true) WITH CHECK (true)` },
      { name: 'textes_lois_read_access', table: 'textes_lois', sql: `CREATE POLICY "textes_lois_read_access" ON textes_lois FOR SELECT USING (true)` }
    ];

    for (const p of policies) {
      try {
        await client.query(p.sql);
        console.log(`Created policy: ${p.name}`);
      } catch (e) {
        console.log(`Error creating ${p.name}:`, e.message);
      }
    }

    console.log('RLS fix completed!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixRLS();
