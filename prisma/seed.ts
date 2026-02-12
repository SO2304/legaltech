// ============================================
// SEED DATA - AVOCAT DE DÉMONSTRATION
// ============================================

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Créer un avocat de démonstration
  const hashedPassword = await bcrypt.hash('demo123456', 10)
  
  const avocat = await prisma.avocat.upsert({
    where: { slug: 'demo-avocat' },
    update: {},
    create: {
      slug: 'demo-avocat',
      email: 'demo@avocat.fr',
      passwordHash: hashedPassword,
      nom: 'Dupont',
      prenom: 'Marie',
      cabinet: 'Cabinet Dupont & Associés',
      adresse: '12 rue de la Paix',
      codePostal: '75001',
      ville: 'Paris',
      telephone: '01 23 45 67 89',
      commissionRate: 20,
      isActive: true,
      emailVerified: new Date(),
    },
  })
  
  console.log('✅ Created demo avocat:', avocat.slug)
  console.log('   Email:', avocat.email)
  console.log('   Password: demo123456')
  console.log('   URL: /avocat/demo-avocat')
  
  // Créer un second avocat pour tester
  const avocat2 = await prisma.avocat.upsert({
    where: { slug: 'maitre-martin' },
    update: {},
    create: {
      slug: 'maitre-martin',
      email: 'martin@avocat.fr',
      passwordHash: await bcrypt.hash('demo123456', 10),
      nom: 'Martin',
      prenom: 'Jean',
      cabinet: 'Martin & Fils',
      adresse: '45 avenue des Champs-Élysées',
      codePostal: '75008',
      ville: 'Paris',
      telephone: '01 98 76 54 32',
      commissionRate: 15,
      isActive: true,
      emailVerified: new Date(),
    },
  })
  
  console.log('✅ Created second avocat:', avocat2.slug)
  
  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
