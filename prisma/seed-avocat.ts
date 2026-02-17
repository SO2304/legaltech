import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating test lawyer account...')

  // Create test lawyer
  const avocat = await prisma.avocat.upsert({
    where: { email: 'test@avocat.fr' },
    update: {},
    create: {
      email: 'test@avocat.fr',
      passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // SHA256 of "password"
      nom: 'Dupont',
      prenom: 'Jean',
      cabinet: 'Cabinet Dupont & Associés',
      pays: 'FRANCE',
      barreau: 'Paris',
      numeroInscription: '12345',
      isActive: true,
    },
  })

  console.log('✅ Test lawyer created:')
  console.log('   Email: test@avocat.fr')
  console.log('   Password: password')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
