import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating test lawyer account...')

  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash('password', 10)

  // Create test lawyer
  const avocat = await prisma.avocat.upsert({
    where: { email: 'test@avocat.fr' },
    update: {},
    create: {
      email: 'test@avocat.fr',
      passwordHash: passwordHash,
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
