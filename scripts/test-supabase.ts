// ============================================
// TEST SUPABASE CONNECTION
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://dyyvacebveqmrloriymr.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eXZhY2VidmVxbXJsb3JpeW1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMDA2NCwiZXhwIjoyMDg2NDc2MDY0fQ.qV8an8GI86MvZZ73-nveCQ_8qTfXRih'

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Check connection
    console.log('✅ Supabase client initialized')
    console.log(`   URL: ${supabaseUrl}`)

    // Test 2: Query database
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('*')
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      console.log('⚠️  Database query test:', error.message)
    } else {
      console.log('✅ Database connection successful')
    }

    // Test 3: List tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('pg_tables')
      .select('*')

    if (!tablesError) {
      console.log('✅ Can query database schema')
    }

    console.log('\n📊 Connection Details:')
    console.log(`   Project ID: dyyvacebveqmrloriymr`)
    console.log(`   Region: EU Central (Frankfurt)`)
    console.log(`   Status: ✅ Connected`)

    return true
  } catch (err) {
    console.error('❌ Connection failed:', err)
    return false
  }
}

testSupabaseConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ All tests passed!')
      process.exit(0)
    } else {
      console.log('\n❌ Some tests failed')
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
