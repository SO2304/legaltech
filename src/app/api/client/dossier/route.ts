import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Pays } from '@prisma/client'
import { getDomainById } from '@/lib/domains'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
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
    const { 
      email, nom, prenom, telephone, pays: paysClient, 
      dateMariage, nombreEnfants, typeProcedure, avocatId,
      domaine, situationJSON, linkToken 
    } = body

    if (!email || !nom || !prenom) {
      return NextResponse.json(
        { error: 'Paramètres manquants: email, nom, prenom requis' },
        { status: 400 }
      )
    }

    // Get domain config for prefix
    const domainConfig = domaine ? getDomainById(domaine) : null
    const prefix = domainConfig?.prefix || 'DOS'

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

    // Resolve linkToken to get lienId if provided
    let lienId = null
    if (linkToken) {
      const lien = await prisma.lien.findUnique({
        where: { token: linkToken }
      })
      if (lien) {
        lienId = lien.id
      }
    }

    // Create dossier with domaine field
    const dossier = await prisma.dossier.create({
      data: {
        reference: `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        avocatId: assignedAvocatId,
        clientId: client.id,
        lienId: lienId,
        domaine: domaine || null,
        pays: paysClient || Pays.FRANCE,
        typeProcedure: typeProcedure || null,
        dateMariage: dateMariage ? new Date(dateMariage) : null,
        nombreEnfants: nombreEnfants || 0,
        analyseIA: situationJSON || null,
        montantTTC: 149.00,
        fraisGestion: 30.00,
        datePurge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        statut: 'EN_ATTENTE_PAIEMENT'
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
