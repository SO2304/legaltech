import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Pays } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    // Get available avocat for distribution
    if (action === 'getAvocat') {
      const avocat = await prisma.avocat.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      })
      
      if (!avocat) {
        return NextResponse.json({ error: 'Aucun avocat disponible' }, { status: 404 })
      }
      
      return NextResponse.json({ avocatId: avocat.id })
    }
    
    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, nom, prenom, telephone, pays: paysClient, dateMariage, nombreEnfants, typeProcedure, avocatId } = body

    if (!email || !nom || !prenom) {
      return NextResponse.json(
        { error: 'Paramètres manquants: email, nom, prenom requis' },
        { status: 400 }
      )
    }

    // Find or create default avocat if not provided
    let assignedAvocatId = avocatId
    if (!assignedAvocatId) {
      const defaultAvocat = await prisma.avocat.findFirst({
        orderBy: { createdAt: 'asc' }
      })
      if (!defaultAvocat) {
        return NextResponse.json(
          { error: 'Aucun avocat disponible. Veuillez réessayer plus tard.' },
          { status: 500 }
        )
      }
      assignedAvocatId = defaultAvocat.id
    }

    // Find or create client
    let client = await prisma.client.findFirst({ where: { email } })
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          email,
          nom,
          prenom,
          telephone,
          pays: paysClient || Pays.FRANCE,
          paysDetecte: paysClient || Pays.FRANCE
        }
      })
    }

    // Create dossier
    const dossier = await prisma.dossier.create({
      data: {
        reference: `DIV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        avocatId: assignedAvocatId,
        clientId: client.id,
        pays: paysClient || Pays.FRANCE,
        typeProcedure: typeProcedure || 'divorce',
        dateMariage: dateMariage ? new Date(dateMariage) : null,
        nombreEnfants: nombreEnfants || 0,
        montantTTC: 149.00,
        fraisGestion: 30.00,
        datePurge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    return NextResponse.json({ 
      success: true, 
      dossier: {
        id: dossier.id,
        reference: dossier.reference,
        datePurge: dossier.datePurge,
        montantTTC: dossier.montantTTC,
        fraisGestion: dossier.fraisGestion
      },
      client: {
        id: client.id,
        email: client.email,
        nom: client.nom,
        prenom: client.prenom
      }
    })
  } catch (error) {
    console.error('Client/Dossier creation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du dossier' },
      { status: 500 }
    )
  }
}
