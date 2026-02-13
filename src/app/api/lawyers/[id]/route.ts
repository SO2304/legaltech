// ============================================
// API - INFOS AVOCAT
// GET /api/lawyers/[id]
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Essayer d'abord par ID, puis par qrCodeUrl
    let lawyer = await prisma.lawyer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        firm: true,
        country: true,
        phone: true,
        barreau: true,
      },
    })
    
    // Si pas trouvé, essayer par qrCodeUrl
    if (!lawyer) {
      lawyer = await prisma.lawyer.findUnique({
        where: { qrCodeUrl: id },
        select: {
          id: true,
          name: true,
          firm: true,
          country: true,
          phone: true,
          barreau: true,
        },
      })
    }
    
    if (!lawyer) {
      return NextResponse.json(
        { success: false, error: 'Avocat non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      lawyer,
    })
    
  } catch (error) {
    console.error('Error fetching lawyer:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
