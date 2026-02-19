// Domaines juridiques - Configuration centrale pour le frontend
// Source de vérité pour toutes les pages frontend

export type ChampSituation = {
  id: string
  label: string
  type: 'text' | 'date' | 'number' | 'select'
  required: boolean
  placeholder?: string
  options?: string[] // si type === 'select'
}

export type DocumentConfig = {
  type: string // valeur de l'enum DocumentType
  label: string
  exige: boolean // true = obligatoire, bloque la validation
  hint?: string // texte d'aide contextuel sous le label
  link?: { label: string; url: string } // lien "Zéro Recherche"
}

export type DomainConfig = {
  id: string // valeur de l'enum DomaineLegal
  label: string
  icon: string // emoji
  description: string // 1 phrase courte
  prefix: string // ex: 'DIV', 'TRAV' — préfixe référence dossier
  champs: ChampSituation[] // formulaire situation dynamique
  documents: DocumentConfig[]
}

// Les 10 domaines juridiques
export const DOMAINS: DomainConfig[] = [
  {
    id: 'DIVORCE',
    label: 'Divorce & Séparation',
    icon: '💔',
    description: 'Procédures de divorce et de séparation.',
    prefix: 'DIV',
    champs: [
      {
        id: 'typeProcedure',
        label: 'Type de procédure',
        type: 'select',
        required: true,
        options: [
          'Divorce par consentement mutuel',
          'Divorce contentieux',
          'Séparation de corps',
          'Rupture de PACS',
        ],
      },
      {
        id: 'dateMariage',
        label: 'Date du mariage',
        type: 'date',
        required: true,
      },
      {
        id: 'nombreEnfants',
        label: "Nombre d'enfants",
        type: 'number',
        required: false,
        placeholder: '0',
      },
      {
        id: 'situationActuelle',
        label: 'Situation actuelle',
        type: 'select',
        required: true,
        options: [
          'En cours de séparation',
          'Séparé(e) mais pas encore de procédure',
          'Déjà divorcé(e)',
        ],
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true, hint: 'Carte nationale didentity ou passeport' },
      { type: 'ACTE_MARIAGE', label: 'Acte de mariage', exige: true, hint: "Document de moins de 3 mois" },
    ],
  },
  {
    id: 'PENAL',
    label: 'Droit Pénal',
    icon: '⚖️',
    description: 'Défense et assistance en matière pénale.',
    prefix: 'PEN',
    champs: [
      {
        id: 'natureAffaire',
        label: 'Nature de laffaire',
        type: 'select',
        required: true,
        options: [
          'Crime',
          'Délit',
          'Contravention',
          'Plainte',
          'Mise en examen',
          'Garde à vue',
          'Comparution',
        ],
      },
      {
        id: 'dateFaits',
        label: 'Date des faits',
        type: 'date',
        required: false,
      },
      {
        id: 'statutProcedure',
        label: 'Statut de la procédure',
        type: 'select',
        required: true,
        options: [
          'Enquête en cours',
          'Mise en examen',
          'Contrôle judiciaire',
          'Détention provisoire',
          'Audience programmée',
        ],
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true },
      { type: 'AUTRE', label: 'Procès-verbal', exige: false, hint: "PV de garde à vue ou d'interpellation" },
    ],
  },
  {
    id: 'IMMOBILIER',
    label: 'Droit Immobilier',
    icon: '🏠',
    description: 'Transactions, baux et litiges immobiliers.',
    prefix: 'IMM',
    champs: [
      {
        id: 'typeBien',
        label: 'Type de bien',
        type: 'select',
        required: true,
        options: [
          'Appartement',
          'Maison',
          'Terrain',
          'Local commercial',
          'Parking',
          'Autre',
        ],
      },
      {
        id: 'natureAffaire',
        label: "Nature de l'affaire",
        type: 'select',
        required: true,
        options: [
          'Achat/Vente',
          'Location',
          'Litige voisin',
          'Copropriété',
          'Travaux',
          'Autre',
        ],
      },
      {
        id: 'valeurBien',
        label: 'Valeur ou montant du litige',
        type: 'number',
        required: false,
        placeholder: 'En euros',
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true },
      { type: 'TITRE_PROPRIETE', label: 'Titre de propriété', exige: false, hint: 'Ou compromis de vente' },
    ],
  },
  {
    id: 'TRAVAIL',
    label: 'Droit du Travail',
    icon: '💼',
    description: 'Contrats, licenciements et conflits sociaux.',
    prefix: 'TRAV',
    champs: [
      {
        id: 'statutSalarie',
        label: 'Statut du salarié',
        type: 'select',
        required: true,
        options: [
          'CDI',
          'CDD',
          'Intérimaire',
          'Stagiaire',
          'Freelance',
          'Cadre',
          'Non-cadre',
        ],
      },
      {
        id: 'natureProbleme',
        label: 'Nature du problème',
        type: 'select',
        required: true,
        options: [
          'Licenciement',
          'Harcèlement',
          'Rupture conventionnelle',
          'Modification du contrat',
          'Non-paiement de salaire',
          'Accident du travail',
          'Autre',
        ],
      },
      {
        id: 'dateProbleme',
        label: 'Date du problème',
        type: 'date',
        required: false,
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true },
      { type: 'BULLETIN_SALAIRE', label: 'Bulletins de salaire', exige: false, hint: 'Les 3 derniers mois' },
      { type: 'AVIS_IMPOSITION', label: 'Avis dimposition', exige: false },
    ],
  },
  {
    id: 'SUCCESSION',
    label: 'Succession & Héritage',
    icon: '📜',
    description: 'Héritages, donations et liquidations.',
    prefix: 'SUCC',
    champs: [
      {
        id: 'lienDefunt',
        label: 'Lien avec le défunt',
        type: 'select',
        required: true,
        options: [
          'Conjoint',
          'Enfant',
          'Frère/Soeur',
          'Parent',
          'Autre familie',
          'Héritier hors ligne',
        ],
      },
      {
        id: 'dateDeces',
        label: 'Date du décès',
        type: 'date',
        required: true,
      },
      {
        id: 'testament',
        label: 'Testament existant',
        type: 'select',
        required: false,
        options: ['Oui', 'Non', 'Ne sais pas'],
      },
      {
        id: 'valeurSuccession',
        label: 'Valeur approximative de la succession',
        type: 'number',
        required: false,
        placeholder: 'En euros',
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true },
      { type: 'AUTRE', label: 'Acte de décès', exige: true, hint: 'Si disponible' },
    ],
  },
  {
    id: 'COMMERCIAL',
    label: 'Droit Commercial',
    icon: '🏢',
    description: 'Création, gestion et litiges commerciaux.',
    prefix: 'COM',
    champs: [
      {
        id: 'typeStructure',
        label: 'Type de structure',
        type: 'select',
        required: true,
        options: [
          'SAS',
          'SARL',
          'SA',
          'EURL',
          'Micro-entreprise',
          'SCI',
          'Autre',
        ],
      },
      {
        id: 'natureAffaire',
        label: "Nature de l'affaire",
        type: 'select',
        required: true,
        options: [
          'Création',
          'Cession',
          'Litige',
          'Contrat',
          'Redressement',
          'Faillite',
          'Autre',
        ],
      },
      {
        id: 'montantLitige',
        label: 'Montant du litige',
        type: 'number',
        required: false,
        placeholder: 'En euros',
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true },
      { type: 'AUTRE', label: 'Kbis', exige: false, hint: 'Extrait Kbis récent' },
    ],
  },
  {
    id: 'IMMIGRATION',
    label: 'Droit des Étrangers',
    icon: '🌍',
    description: 'Visas, titres de séjour et citoyenneté.',
    prefix: 'ETR',
    champs: [
      {
        id: 'paysOrigine',
        label: 'Pays dorigine',
        type: 'select',
        required: true,
        options: [
          '🇩🇿 Algérie',
          '🇲🇦 Maroc',
          '🇹🇳 Tunisie',
          '🇸🇳 Sénégal',
          '🇨🇮 Côte dIvoire',
          '🇨🇩 RDC',
          '🇨🇳 Chine',
          '🇷🇺 Russie',
          '🇺🇦 Ukraine',
          '🇬🇧 Royaume-Uni',
          '🇺🇸 États-Unis',
          '🇧🇷 Brésil',
          'Inde',
          'Autre',
        ],
      },
      {
        id: 'typeDemande',
        label: 'Type de demande',
        type: 'select',
        required: true,
        options: [
          'Visa',
          'Titre de séjour',
          'Regroupement familial',
          'Naturalisation',
          'Asile',
          'Autre',
        ],
      },
      {
        id: 'dateEntree',
        label: "Date d'entrée en France",
        type: 'date',
        required: false,
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true, hint: 'Passeport valide' },
      { type: 'AUTRE', label: 'Justificatifs divers', exige: false, hint: 'Photos, avis dimposition, etc.' },
    ],
  },
  {
    id: 'CONSOMMATION',
    label: 'Droit de la Consommation',
    icon: '🛒',
    description: 'Litiges consommateurs et garanties.',
    prefix: 'CONS',
    champs: [
      {
        id: 'typeContrat',
        label: 'Type de contrat',
        type: 'select',
        required: true,
        options: [
          'Achat',
          'Location',
          'Prestation de services',
          'Crédit',
          'Assurance',
          'Voyage',
          'Autre',
        ],
      },
      {
        id: 'natureLitige',
        label: 'Nature du litige',
        type: 'select',
        required: true,
        options: [
          'Non-livraison',
          'Produit défectueux',
          'Non-conformité',
          'Rétractation',
          'Garantie',
          'Clause abusive',
          'Autre',
        ],
      },
      {
        id: 'montant',
        label: 'Montant en jeu',
        type: 'number',
        required: false,
        placeholder: 'En euros',
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true },
      { type: 'AUTRE', label: 'Contrat / Facture', exige: false },
      { type: 'RELEVE_BANCAIRE', label: 'Relevé bancaire', exige: false, hint: 'Si paiement par carte' },
    ],
  },
  {
    id: 'FAMILLE',
    label: 'Droit de la Famille',
    icon: '👨‍👩‍👧',
    description: 'Pensions, garde et autorité parentale.',
    prefix: 'FAM',
    champs: [
      {
        id: 'typeDemande',
        label: 'Type de demande',
        type: 'select',
        required: true,
        options: [
          'Pension alimentaire',
          'Garde des enfants',
          'Droit de visite',
          'Autorité parentale',
          'Modification jugement',
          'Autre',
        ],
      },
      {
        id: 'nombreEnfants',
        label: "Nombre d'enfants",
        type: 'number',
        required: true,
        placeholder: '0',
      },
      {
        id: 'revenus',
        label: 'Revenus mensuels approximatifs',
        type: 'number',
        required: false,
        placeholder: 'En euros',
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true },
      { type: 'ACTE_MARIAGE', label: 'Acte de mariage/PACS', exige: false },
      { type: 'BULLETIN_SALAIRE', label: 'Bulletin de salaire', exige: false },
    ],
  },
  {
    id: 'ADMINISTRATIF',
    label: 'Droit Administratif',
    icon: '🏛️',
    description: 'Recours contre ladministration.',
    prefix: 'ADM',
    champs: [
      {
        id: 'typeAdministration',
        label: 'Type dadministration',
        type: 'select',
        required: true,
        options: [
          'État',
          'Région',
          'Département',
          'Commune',
          'Établissement public',
          'Autre',
        ],
      },
      {
        id: 'natureRecours',
        label: 'Nature du recours',
        type: 'select',
        required: true,
        options: [
          'Refus de permis',
          'Sanction',
          'Aide refusée',
          'Urbanisme',
          'Expropriation',
          'Fonction publique',
          'Autre',
        ],
      },
      {
        id: 'dateDecision',
        label: 'Date de la décision',
        type: 'date',
        required: false,
      },
    ],
    documents: [
      { type: 'CARTE_IDENTITE', label: 'Pièce didentité', exige: true },
      { type: 'AUTRE', label: 'Décision contestée', exige: true, hint: "Lettre de notification" },
    ],
  },
]

// Fonction pour récupérer un domaine par ID
export function getDomainById(id: string): DomainConfig | undefined {
  return DOMAINS.find((domain) => domain.id === id)
}

// Couleurs des badges par domaine
export const DOMAIN_COLORS: Record<string, string> = {
  DIVORCE: 'bg-pink-100 text-pink-800',
  PENAL: 'bg-slate-100 text-slate-800',
  IMMOBILIER: 'bg-amber-100 text-amber-800',
  TRAVAIL: 'bg-blue-100 text-blue-800',
  SUCCESSION: 'bg-yellow-100 text-yellow-800',
  COMMERCIAL: 'bg-purple-100 text-purple-800',
  IMMIGRATION: 'bg-emerald-100 text-emerald-800',
  CONSOMMATION: 'bg-orange-100 text-orange-800',
  FAMILLE: 'bg-rose-100 text-rose-800',
  ADMINISTRATIF: 'bg-cyan-100 text-cyan-800',
}
