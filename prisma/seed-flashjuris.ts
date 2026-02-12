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
      city: 'Paris',
      qrCodeUrl: qrCode.url,
      qrCodeImage: qrCode.imageBase64,
      plan: 'pro',
    },
  })
  
  console.log(`✅ Created demo lawyer: ${lawyer.name}`)
  console.log(`   QR Code URL: ${qrCode.url}`)
  
  // Créer un dossier de test
  const testCase = await prisma.case.create({
    data: {
      reference: 'FJ-DEMO001',
      lawyerId: lawyer.id,
      clientName: 'Client Test',
      clientEmail: 'client@test.fr',
      clientPhone: '06 12 34 56 78',
      caseType: 'Divorce',
      caseDescription: 'Dossier de test pour démonstration',
      status: 'completed',
    },
  })
  
  console.log(`✅ Created test case: ${testCase.reference}`)
  
  // Créer une analyse de test
  const analysis = await prisma.analysis.create({
    data: {
      caseId: testCase.id,
      summary: 'Dossier de divorce par consentement mutuel. Les deux parties sont d\'accord sur les modalités de séparation.',
      keyPoints: JSON.stringify([
        'Mariage célébré le 15/03/2010 à Paris',
        '2 enfants nés de l\'union',
        'Résidence principale à Paris 16ème',
        'Régime matrimonial: communauté réduite aux acquêts',
      ]),
      risks: JSON.stringify([
        'Désaccord potentiel sur la résidence des enfants',
        'Évaluation du patrimoine immobilier à vérifier',
      ]),
      recommendations: JSON.stringify([
        'Proposer une médiation familiale',
        'Faire évaluer le bien immobilier par un expert',
        'Prévoir une pension alimentaire provisoire',
      ]),
      nextSteps: JSON.stringify([
        'Prendre rendez-vous avec les deux époux',
        'Demander les documents complémentaires',
        'Rédiger la convention de divorce',
      ]),
      status: 'completed',
      completedAt: new Date(),
    },
  })
  
  console.log(`✅ Created test analysis`)
  
  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Demo credentials:')
  console.log('   Lawyer ID: demo-lawyer')
  console.log('   Scan URL: http://localhost:3000/scan/demo-lawyer')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
