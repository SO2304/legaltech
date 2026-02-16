import { Pays, DocumentType } from '@prisma/client'

/**
 * SERVICE SMART SOURCING
 * Fournit des liens vers les portails gouvernementaux officiels
 * pour aider les clients à obtenir les documents nécessaires
 */

type PortailLinks = Record<Pays, Partial<Record<DocumentType, string>>>

const PORTAILS_GOUVERNEMENTAUX: PortailLinks = {
  FRANCE: {
    ACTE_MARIAGE: 'https://www.service-public.fr/particuliers/vosdroits/R1406',
    CARTE_IDENTITE: 'https://www.service-public.fr/particuliers/vosdroits/N358',
    AVIS_IMPOSITION: 'https://www.impots.gouv.fr/portail/particulier/documents',
    TITRE_PROPRIETE: 'https://www.service-public.fr/particuliers/vosdroits/F17759',
    BULLETIN_SALAIRE: 'https://www.service-public.fr/particuliers/vosdroits/F559',
    RELEVE_BANCAIRE: 'https://www.service-public.fr/particuliers/vosdroits/F2756',
    AUTRE: 'https://www.service-public.fr/particuliers/vosdroits/N159' // Divorce
  },

  BELGIQUE: {
    ACTE_MARIAGE: 'https://www.belgium.be/fr/famille/couple/mariage',
    CARTE_IDENTITE: 'https://www.belgium.be/fr/famille/documents_d_identite',
    AVIS_IMPOSITION: 'https://finances.belgium.be/fr/particuliers',
    TITRE_PROPRIETE: 'https://www.belgium.be/fr/logement/acheter_et_vendre/achat',
    BULLETIN_SALAIRE: 'https://www.belgium.be/fr/emploi/contrats_de_travail',
    RELEVE_BANCAIRE: 'https://www.nbb.be/fr',
    AUTRE: 'https://www.belgium.be/fr/famille/couple/divorce'
  },

  SUISSE: {
    ACTE_MARIAGE: 'https://www.ch.ch/fr/mariage-et-partenariat/mariage/',
    CARTE_IDENTITE: 'https://www.ch.ch/fr/documents-d-identite/',
    AVIS_IMPOSITION: 'https://www.estv.admin.ch/',
    TITRE_PROPRIETE: 'https://www.ch.ch/fr/achat-et-vente-de-biens-immobiliers/',
    BULLETIN_SALAIRE: 'https://www.ch.ch/fr/travail/emploi/',
    RELEVE_BANCAIRE: 'https://www.ch.ch/fr/comptes-et-cartes/',
    AUTRE: 'https://www.ch.ch/fr/mariage-et-partenariat/divorce/'
  },

  LUXEMBOURG: {
    ACTE_MARIAGE: 'https://guichet.public.lu/fr/citoyens/famille/mariage.html',
    CARTE_IDENTITE: 'https://guichet.public.lu/fr/citoyens/citoyennete/documents-identite-voyage.html',
    AVIS_IMPOSITION: 'https://impotsdirects.public.lu/',
    TITRE_PROPRIETE: 'https://guichet.public.lu/fr/citoyens/logement/achat-vente-bien-immobilier.html',
    BULLETIN_SALAIRE: 'https://guichet.public.lu/fr/citoyens/travail-emploi.html',
    RELEVE_BANCAIRE: 'https://www.cssf.lu/',
    AUTRE: 'https://guichet.public.lu/fr/citoyens/famille/divorce-separation.html'
  }
}

/**
 * Récupérer le lien du portail gouvernemental pour un type de document
 */
export function getLienPortailGouvernemental(
  pays: Pays,
  typeDocument: DocumentType
): string | null {
  return PORTAILS_GOUVERNEMENTAUX[pays]?.[typeDocument] || null
}

/**
 * Récupérer tous les liens pour un pays
 */
export function getTousLiensPortails(pays: Pays): Partial<Record<DocumentType, string>> {
  return PORTAILS_GOUVERNEMENTAUX[pays] || {}
}

/**
 * Vérifier si un lien existe pour un type de document
 */
export function hasLienPortail(pays: Pays, typeDocument: DocumentType): boolean {
  return !!getLienPortailGouvernemental(pays, typeDocument)
}

/**
 * Obtenir le nom du portail gouvernemental par pays
 */
export function getNomPortail(pays: Pays): string {
  const noms: Record<Pays, string> = {
    FRANCE: 'Service-Public.fr',
    BELGIQUE: 'Belgium.be',
    SUISSE: 'CH.ch',
    LUXEMBOURG: 'Guichet.lu'
  }

  return noms[pays]
}

/**
 * Obtenir une description du document et où le trouver
 */
export function getDescriptionDocument(typeDocument: DocumentType, pays: Pays): string {
  const descriptions: Record<DocumentType, string> = {
    ACTE_MARIAGE: `L'acte de mariage est un document officiel délivré par la mairie où le mariage a été célébré. Il atteste de l'union légale entre deux personnes.`,
    CARTE_IDENTITE: `La carte d'identité (ou passeport) est nécessaire pour prouver votre identité. Elle doit être en cours de validité.`,
    BULLETIN_SALAIRE: `Les bulletins de salaire des 3 derniers mois permettent de justifier vos revenus professionnels.`,
    AVIS_IMPOSITION: `L'avis d'imposition (ou de non-imposition) du dernier exercice fiscal permet de justifier vos revenus annuels.`,
    RELEVE_BANCAIRE: `Les relevés bancaires des 3 derniers mois permettent de justifier votre situation financière et vos dépenses.`,
    TITRE_PROPRIETE: `Le titre de propriété (acte notarié) prouve la propriété d'un bien immobilier (maison, appartement, terrain).`,
    AUTRE: `Document complémentaire pouvant être utile à votre dossier de divorce.`
  }

  return descriptions[typeDocument] || descriptions.AUTRE
}

/**
 * Obtenir les documents recommandés pour un pays
 */
export function getDocumentsRecommandes(pays: Pays): DocumentType[] {
  // Documents de base recommandés pour tous les pays
  const documentsBase: DocumentType[] = [
    'ACTE_MARIAGE',
    'CARTE_IDENTITE',
    'BULLETIN_SALAIRE',
    'AVIS_IMPOSITION',
    'RELEVE_BANCAIRE'
  ]

  return documentsBase
}
