// ============================================
// API - INSCRIPTION AVOCAT
// POST /api/lawyers/register
// Crée un avocat et génère son QR code
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateLawyerQRCode } from '@/lib/qrcode/generator'
import { sendWelcomeEmail } from '@/lib/email-service'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, firm, phone } = body
    
    // Validation
    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email et nom obligatoires' },
        { status: 400 }
      )
    }
    
    // Vérifier si l'email existe déjà
    const existing = await prisma.lawyer.findUnique({
      where: { email },
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Cet email est déjà inscrit' },
        { status: 400 }
      )
    }
    
    // Générer un ID unique
    const lawyerId = nanoid(10)
    
    // Générer le QR code
    const qrCode = await generateLawyerQRCode(lawyerId)
    
    // Créer l'avocat
    const lawyer = await prisma.lawyer.create({
      data: {
        id: lawyerId,
        email,
        name,
        firm: firm || null,
        phone: phone || null,
        qrCodeUrl: qrCode.url,
        qrCodeImage: qrCode.imageBase64,
        plan: 'free',
      },
    })
    
    // Envoyer l'email de bienvenue avec le QR code
    await sendWelcomeEmail({
      id: lawyer.id,
      email: lawyer.email,
      name: lawyer.name,
      qrCodeImage: lawyer.qrCodeImage || '',
    })
    
    // Logger l'événement
    await prisma.event.create({
      data: {
        type: 'lawyer_registered',
        lawyerId: lawyer.id,
        metadata: JSON.stringify({ email, name }),
      },
    })
    
    return NextResponse.json({
      success: true,
      lawyer: {
        id: lawyer.id,
        name: lawyer.name,
        email: lawyer.email,
      },
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
