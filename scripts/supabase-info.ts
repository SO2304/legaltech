// ============================================
// SUPABASE CONNECTION INFO
// ============================================

import { createClient } from '@supabase/supabase-js'

const config = {
  url: 'https://dyyvacebveqmrloriymr.supabase.co',
  projectId: 'dyyvacebveqmrloriymr',
  region: 'EU Central (Frankfurt)',

  // Connection strings pour Prisma
  poolerUrl: 'postgresql://postgres.dyyvacebveqmrloriymr:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  directUrl: 'postgresql://postgres.dyyvacebveqmrloriymr:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
}

console.log('📊 SUPABASE CONFIGURATION\n')
console.log('✅ Project URL:', config.url)
console.log('✅ Project ID:', config.projectId)
console.log('✅ Region:', config.region)
console.log('\n📝 NEXT STEPS:\n')
console.log('1. Get your database password from Supabase Dashboard:')
console.log('   https://supabase.com/dashboard/project/dyyvacebveqmrloriymr/settings/database')
console.log('\n2. Update .env.local with:')
console.log('   DATABASE_URL=' + config.poolerUrl)
console.log('   DIRECT_URL=' + config.directUrl)
console.log('\n3. Run migrations:')
console.log('   npx prisma migrate deploy')
console.log('\n4. Generate Prisma client:')
console.log('   npx prisma generate')

// Test basic connection
async function testConnection() {
  console.log('\n🔍 Testing basic connection...\n')

  const supabase = createClient(
    config.url,
    process.env.SUPABASE_ANON_KEY || ''
  )

  try {
    // Test with a simple query that doesn't require auth
    const { error } = await supabase.from('_prisma_migrations').select('count').limit(1)

    if (error) {
      if (error.message.includes('relation') || error.message.includes('not found')) {
        console.log('✅ Connection OK (tables not yet created)')
        console.log('   Run: npx prisma db push')
      } else {
        console.log('⚠️  Error:', error.message)
      }
    } else {
      console.log('✅ Connection OK and database has tables')
    }
  } catch (err: any) {
    console.log('⚠️  Connection test:', err.message)
  }
}

testConnection()
