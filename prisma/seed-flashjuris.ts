// ============================================
// FLASHJURIS - SEED DATABASE MULTI-JURIDICTION
// FR, BE, CH, LU
// ============================================

import { PrismaClient } from '@prisma/client'
import { generateLawyerQRCode } from '../src/lib/qrcode/generator'
import { PRICES, type CountryCode } from '../src/lib/countries'

const prisma = new PrismaClient()

const DEMO_LAWYERS = [
  { country: 'FR', name: 'Maître Jean Dupont', firm: 'Cabinet Dupont & Associés', city: 'Paris', email: 'avocat@demo.fr' },
  { country: 'BE', name: 'Me Marie Martin', firm: 'Martin & Partners', city: 'Bruxelles', email: 'avocat-be@demo.fr' },
  { country: 'CH', name: 'Me Pierre Müller', firm: 'Müller Avocats', city: 'Genève', email: 'avocat-ch@demo.fr' },
  { country: 'LU', name: 'Me Sophie Weber', firm: 'Weber Legal', city: 'Luxembourg', email: 'avocat-lu@demo.fr' },
] as const

async function main() {
  console.log('🌱 Seeding FlashJuris database (Multi-juridiction)...')
  
  for (const demo of DEMO_LAWYERS) {
    const lawyerId = `demo-${demo.country.toLowerCase()}`
    const qrCode = await generateLawyerQRCode(lawyerId)
    const price = PRICES[demo.country as CountryCode]
    const commission = Math.round(price.amount * 0.20)
    
    const lawyer = await prisma.lawyer.upsert({
      where: { id: lawyerId },
      update: {},
      create: {
        id: lawyerId,
        email: demo.email,
        name: demo.name,
        firm: demo.firm,
        country: demo.country,
        qrCodeUrl: qrCode.url,
        qrCodeImage: qrCode.imageBase64,
        commissionRate: 20.0,
        isActive: true,
      },
    })
    
    console.log(`✅ ${demo.country}: ${lawyer.name}`)
    console.log(`   Email: ${lawyer.email}`)
    console.log(`   QR Code: ${qrCode.url}`)
    console.log(`   Prix client: ${price.display}`)
    console.log(`   Commission: ${(commission / 100).toFixed(2)} ${price.currency}`)
    
    // Créer un dossier test
    const purgeAt = new Date()
    purgeAt.setDate(purgeAt.getDate() + 7)
    
    await prisma.case.create({
      data: {
        reference: `FJ-${demo.country}-DEMO01`,
        lawyerId: lawyer.id,
        country: demo.country,
        clientName: 'Client Test',
        clientEmail: 'client@test.fr',
        clientPhone: '+33612345678',
        caseType: 'Divorce',
        status: 'sent',
        paymentStatus: 'succeeded',
        priceCents: price.amount,
        priceCurrency: price.currency,
        commissionAmount: commission,
        commissionCurrency: price.currency,
        purgeAt,
        emailSentAt: new Date(),
      },
    })
    
    console.log(`   Test case: FJ-${demo.country}-DEMO01`)
    console.log('')
  }
  
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('📋 Demo Scan URLs:')
  console.log('   France:    http://localhost:3000/scan/demo-fr')
  console.log('   Belgique:  http://localhost:3000/scan/demo-be')
  console.log('   Suisse:    http://localhost:3000/scan/demo-ch')
  console.log('   Luxembourg: http://localhost:3000/scan/demo-lu')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
