const { Client } = require('pg');

async function fixRLS() {
  const client = new Client({
    host: 'db.dyyvacebveqmrloriymr.supabase.co',
    port: 6543,
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

    // Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS avocat_see_own_dossiers ON dossiers',
      'DROP POLICY IF EXISTS client_see_own_dossiers ON dossiers',
      'DROP POLICY IF EXISTS avocat_see_own_documents ON documents'
    ];

    for (const sql of dropPolicies) {
      await client.query(sql);
      console.log('Dropped policy');
    }

    // Create permissive policies for development
    const createPolicies = [
      `CREATE POLICY "avocats_full_access" ON avocats FOR ALL USING (true) WITH CHECK (true)`,
      `CREATE POLICY "clients_full_access" ON clients FOR ALL USING (true) WITH CHECK (true)`,
      `CREATE POLICY "dossiers_full_access" ON dossiers FOR ALL USING (true) WITH CHECK (true)`,
      `CREATE POLICY "documents_full_access" ON documents FOR ALL USING (true) WITH CHECK (true)`,
      `CREATE POLICY "textes_lois_read_access" ON textes_lois FOR SELECT USING (true)`
    ];

    for (const sql of createPolicies) {
      await client.query(sql);
      console.log('Created policy:', sql.substring(0, 50) + '...');
    }

    console.log('RLS policies fixed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixRLS();
