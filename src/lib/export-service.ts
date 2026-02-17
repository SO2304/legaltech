/**
 * Export Service - Génère ZIP et PDF pour les dossiers validés
 * Compatible avec les logiciels de cabinet (Secib, Kleos, etc.)
 */

import prisma from './prisma'

export interface ExportData {
  dossier: {
    id: string
    reference: string
    statut: string
    pays: string
    typeProcedure: string | null
    dateMariage: Date | null
    nombreEnfants: number
    analyseIA: string | null
    syntheseHTML: string | null
    sourcesLegales: string | null
    montantTTC: number
    fraisGestion: number
    stripePaidAt: Date | null
    createdAt: Date
    updatedAt: Date
  }
  client: {
    nom: string
    prenom: string
    email: string
    telephone: string | null
    pays: string
    dateNaissance: Date | null
    adresse: string | null
    ville: string | null
  }
  avocat: {
    nom: string
    prenom: string
    cabinet: string | null
    barreau: string | null
  }
  documents: Array<{
    id: string
    type: string
    nomOriginal: string
    mimeType: string
    taille: number
    exigeLegal: boolean
    estValide: boolean
    texteExtrait: string | null
    donneesExtraites: string | null
  }>
}

/**
 * Récupère les données complètes d'un dossier pour l'export
 */
export async function getDossierForExport(dossierId: string, avocatId: string): Promise<ExportData | null> {
  const dossier = await prisma.dossier.findFirst({
    where: {
      id: dossierId,
      avocatId: avocatId,
      statut: 'VALIDE' // Uniquement les dossiers validés
    },
    include: {
      client: true,
      avocat: {
        select: {
          nom: true,
          prenom: true,
          cabinet: true,
          barreau: true
        }
      },
      documents: {
        where: {
          isPurged: false
        },
        select: {
          id: true,
          type: true,
          nomOriginal: true,
          mimeType: true,
          taille: true,
          exigeLegal: true,
          estValide: true,
          texteExtrait: true,
          donneesExtraites: true
        }
      }
    }
  })

  if (!dossier) return null

  return {
    dossier: {
      id: dossier.id,
      reference: dossier.reference,
      statut: dossier.statut,
      pays: dossier.pays,
      typeProcedure: dossier.typeProcedure,
      dateMariage: dossier.dateMariage,
      nombreEnfants: dossier.nombreEnfants,
      analyseIA: dossier.analyseIA,
      syntheseHTML: dossier.syntheseHTML,
      sourcesLegales: dossier.sourcesLegales,
      montantTTC: dossier.montantTTC,
      fraisGestion: dossier.fraisGestion,
      stripePaidAt: dossier.stripePaidAt,
      createdAt: dossier.createdAt,
      updatedAt: dossier.updatedAt
    },
    client: {
      nom: dossier.client.nom,
      prenom: dossier.client.prenom,
      email: dossier.client.email,
      telephone: dossier.client.telephone,
      pays: dossier.client.pays,
      dateNaissance: dossier.client.datenaissance,
      adresse: dossier.client.adresse,
      ville: dossier.client.ville
    },
    avocat: {
      nom: dossier.avocat.nom,
      prenom: dossier.avocat.prenom,
      cabinet: dossier.avocat.cabinet,
      barreau: dossier.avocat.barreau
    },
    documents: dossier.documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      nomOriginal: doc.nomOriginal,
      mimeType: doc.mimeType,
      taille: doc.taille,
      exigeLegal: doc.exigeLegal,
      estValide: doc.estValide,
      texteExtrait: doc.texteExtrait,
      donneesExtraites: doc.donneesExtraites
    }))
  }
}

/**
 * Génère le contenu textuel du récapitulatif PDF
 * (Le PDF réel serait généré côté client avec une librairie)
 */
export function generateRecapitulatifText(data: ExportData): string {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Non spécifié'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant)
  }

  const lines = [
    '═══════════════════════════════════════════════════════════════',
    '                    RÉCAPITULATIF DOSSIER',
    '═══════════════════════════════════════════════════════════════',
    '',
    `Référence: ${data.dossier.reference}`,
    `Date de création: ${formatDate(data.dossier.createdAt)}`,
    `Statut: ${data.dossier.statut}`,
    `Pays: ${data.dossier.pays}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                         CLIENT',
    '───────────────────────────────────────────────────────────────',
    `Nom: ${data.client.prenom} ${data.client.nom}`,
    `Email: ${data.client.email}`,
    `Téléphone: ${data.client.telephone || 'Non spécifié'}`,
    `Date de naissance: ${formatDate(data.client.dateNaissance)}`,
    `Adresse: ${data.client.adresse || 'Non spécifiée'}`,
    `Ville: ${data.client.ville || 'Non spécifiée'}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                         AVOCAT',
    '───────────────────────────────────────────────────────────────',
    `Nom: ${data.avocat.prenom} ${data.avocat.nom}`,
    `Cabinet: ${data.avocat.cabinet || 'Non spécifié'}`,
    `Barreau: ${data.avocat.barreau || 'Non spécifié'}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                      INFORMATIONS DOSSIER',
    '───────────────────────────────────────────────────────────────',
    `Type de procédure: ${data.dossier.typeProcedure || 'Non spécifié'}`,
    `Date de mariage: ${formatDate(data.dossier.dateMariage)}`,
    `Nombre d'enfants: ${data.dossier.nombreEnfants}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                      DOCUMENTS',
    '───────────────────────────────────────────────────────────────',
    `Nombre de documents: ${data.documents.length}`,
    '',
    ...data.documents.map((doc, index) => {
      const status = doc.estValide ? '✓ Valide' : '✗ En attente'
      const legal = doc.exigeLegal ? ' (Exigé)' : ''
      return `${index + 1}. ${doc.type}: ${doc.nomOriginal} - ${status}${legal}`
    }),
    '',
    '───────────────────────────────────────────────────────────────',
    '                       SYNTHÈSE IA',
    '───────────────────────────────────────────────────────────────',
    data.dossier.analyseIA || 'Analyse non disponible',
    '',
    '───────────────────────────────────────────────────────────────',
    '                    MONTANT ET PAIEMENT',
    '───────────────────────────────────────────────────────────────',
    `Montant TTC: ${formatMontant(data.dossier.montantTTC)}`,
    `Frais de gestion: ${formatMontant(data.dossier.fraisGestion)}`,
    `Payé le: ${formatDate(data.dossier.stripePaidAt)}`,
    '',
    '═══════════════════════════════════════════════════════════════',
    '          Document généré par LegalTech - Gagnant-Gagnant',
    `          Date d'export: ${new Date().toLocaleString('fr-FR')}`,
    '═══════════════════════════════════════════════════════════════'
  ]

  return lines.join('\n')
}

/**
 * Liste les types de documents par pays pour les liens administratifs
 */
export function getLiensAdministratifs(pays: string): { nom: string; url: string; description: string }[] {
  const liensCommuns = [
    {
      nom: 'Service-Public.fr',
      url: 'https://www.service-public.fr',
      description: 'Portails officiels des démarches administratives'
    },
    {
      nom: 'impots.gouv.fr',
      url: 'https://www.impots.gouv.fr',
      description: 'Déclaration de revenus et documents fiscaux'
    }
  ]

  const liensFrance = [
    {
      nom: 'Justice.fr',
      url: 'https://www.justice.fr',
      description: 'Portails juridictionnels et procédures'
    },
    {
      nom: 'Diplomatie.gouv.fr',
      url: 'https://www.diplomatie.gouv.fr',
      description: 'Actes d\'état civil à l\'étranger'
    }
  ]

  const liensBelgique = [
    {
      nom: 'Justice.be',
      url: 'https://www.justice.be',
      description: 'Services fédéraux de la Justice'
    }
  ]

  const liensSuisse = [
    {
      nom: 'admin.ch',
      url: 'https://www.admin.ch',
      description: 'Portail de l\'administration suisse'
    }
  ]

  const liensLuxembourg = [
    {
      nom: 'justice.public.lu',
      url: 'https://justice.public.lu',
      description: 'Ministère de la Justice du Luxembourg'
    }
  ]

  const liensSpecifiques: Record<string, { nom: string; url: string; description: string }[]> = {
    FRANCE: liensFrance,
    BELGIQUE: liensBelgique,
    SUISSE: liensSuisse,
    LUXEMBOURG: liensLuxembourg
  }

  return [...liensCommuns, ...(liensSpecifiques[pays] || [])]
}
