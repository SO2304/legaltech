// ============================================
// FLASHJURIS - SEED DATABASE
// ============================================

import { PrismaClient } from '@prisma/client'
import { generateLawyerQRCode } from '../src/lib/qrcode/generator'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding FlashJuris database...')
  
  // Créer un avocat de démo
  const lawyerId = 'demo-lawyer'
  const qrCode = await generateLawyerQRCode(lawyerId)
  
  const lawyer = await prisma.lawyer.upsert({
    where: { id: lawyerId },
    update: {},
    create: {
      id: lawyerId,
      email: 'avocat@demo.fr',
      name: 'Maître Jean Dupont',
      firm: 'Cabinet Dupont & Associés',
      phone: '01 23 45 67 89',
      qrCodeUrl: qrCode.url,
      qrCodeImage: qrCode.imageBase64,
      commissionRate: 20.0,
      isActive: true,
    },
  })
  
  console.log(`✅ Created demo lawyer: ${lawyer.name}`)
  console.log(`   Email: ${lawyer.email}`)
  console.log(`   QR Code URL: ${qrCode.url}`)
  console.log(`   Commission: ${lawyer.commissionRate}%`)
  
  // Créer un dossier de test avec purge à J+7
  const purgeAt = new Date()
  purgeAt.setDate(purgeAt.getDate() + 7)
  
  const testCase = await prisma.case.create({
    data: {
      reference: 'FJ-DEMO001',
      lawyerId: lawyer.id,
      clientName: 'Client Test',
      clientEmail: 'client@test.fr',
      clientPhone: '06 12 34 56 78',
      caseType: 'Divorce',
      caseDescription: 'Dossier de test pour démonstration',
      status: 'sent',
      paymentStatus: 'succeeded',
      commissionAmount: 2980, // 20% de 149€ = 29.80€
      purgeAt,
      emailSentAt: new Date(),
    },
  })
  
  console.log(`✅ Created test case: ${testCase.reference}`)
  console.log(`   Commission: ${(testCase.commissionAmount / 100).toFixed(2)}€`)
  console.log(`   Purge le: ${purgeAt.toLocaleDateString('fr-FR')}`)
  
  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Demo credentials:')
  console.log('   Lawyer ID: demo-lawyer')
  console.log('   Scan URL: http://localhost:3000/scan/demo-lawyer')
  console.log('   Price: 149€ (client)')
  console.log('   Commission: 29.80€ (20%)')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
