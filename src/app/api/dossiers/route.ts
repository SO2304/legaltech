// ============================================
// API: CRÉATION DOSSIER
// Création d'un nouveau dossier de divorce
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWebhookSecret } from '@/lib/encryption'
import type { CreateDossierInput, CreateClientInput } from '@/types'
import { z } from 'zod'

// Schéma de validation
const createClientSchema = z.object({
  email: z.string().email(),
  telephone: z.string().optional(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  profession: z.string().optional(),
})

const createDossierSchema = z.object({
  avocatSlug: z.string(),
  client: createClientSchema,
  typeProcedure: z.enum(['CONSENTEMENT_MUTUEL', 'ACCEPTATION_PRINCIPE', 'FAUTE', 'RUPTURE_VIE_COMMUNE']),
  regimeMatrimonial: z.enum(['COMMUNAUTE_REDUITE_ACQUETS', 'COMMUNAUTE_UNIVERSELLE', 'SEPARATION_DE_BIENS', 'PARTICIPATION_AUX_ACQUETS', 'INDETERMINE']),
  dateMariage: z.string().optional(),
  lieuMariage: z.string().optional(),
  dateSeparation: z.string().optional(),
  motifDivorce: z.string().optional(),
  conjoint: z.any().optional(),
  enfants: z.array(z.any()).optional(),
  patrimoine: z.any().optional(),
  pensions: z.any().optional(),
  consentementRGPD: z.boolean(),
  ipConsentement: z.string(),
})

// Fonction pour générer une référence unique
async function generateReference(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.dossier.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  })
  const sequence = (count + 1).toString().padStart(5, '0')
  return `REF-${year}-${sequence}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    const validated = createDossierSchema.parse(body)
    
    // Vérifier que l'avocat existe et est actif
    const avocat = await prisma.avocat.findUnique({
      where: { slug: validated.avocatSlug },
    })
    
    if (!avocat || !avocat.isActive) {
      return NextResponse.json(
        { success: false, error: 'Avocat non trouvé ou inactif' },
        { status: 404 }
      )
    }
    
    // Créer ou récupérer le client
    let client = await prisma.client.findFirst({
      where: { email: validated.client.email },
    })
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          email: validated.client.email,
          telephone: validated.client.telephone,
          nom: validated.client.nom,
          prenom: validated.client.prenom,
          dateNaissance: validated.client.dateNaissance ? new Date(validated.client.dateNaissance) : null,
          lieuNaissance: validated.client.lieuNaissance,
          adresse: validated.client.adresse,
          codePostal: validated.client.codePostal,
          ville: validated.client.ville,
          profession: validated.client.profession,
        },
      })
    }
    
    // Générer la référence
    const reference = await generateReference()
    
    // Calculer la date de purge (J+7)
    const purgeDate = new Date()
    purgeDate.setDate(purgeDate.getDate() + 7)
    
    // Créer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        reference,
        statut: 'BROUILLON',
        typeProcedure: validated.typeProcedure,
        regimeMatrimonial: validated.regimeMatrimonial,
        dateMariage: validated.dateMariage ? new Date(validated.dateMariage) : null,
        lieuMariage: validated.lieuMariage,
        dateSeparation: validated.dateSeparation ? new Date(validated.dateSeparation) : null,
        motifDivorce: validated.motifDivorce,
        conjoint: validated.conjoint ? JSON.stringify(validated.conjoint) : null,
        enfants: validated.enfants ? JSON.stringify(validated.enfants) : null,
        patrimoine: validated.patrimoine ? JSON.stringify(validated.patrimoine) : null,
        pensions: validated.pensions ? JSON.stringify(validated.pensions) : null,
        consentementRGPD: validated.consentementRGPD,
        dateConsentement: new Date(),
        ipConsentement: validated.ipConsentement,
        datePurge: purgeDate,
        avocatId: avocat.id,
        clientId: client.id,
      },
    })
    
    // Créer la commission associée
    await prisma.commission.create({
      data: {
        montant: 0, // Sera calculé après analyse
        taux: avocat.commissionRate,
        statut: 'EN_ATTENTE',
        avocatId: avocat.id,
        dossierId: dossier.id,
      },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: dossier.id,
        reference: dossier.reference,
        statut: dossier.statut,
      },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating dossier:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du dossier' },
      { status: 500 }
    )
  }
}
