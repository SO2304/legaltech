// ============================================
// FLASHJURIS - CONFIGURATION MULTI-JURIDICTION
// France, Belgique, Suisse, Luxembourg
// ============================================

export type CountryCode = 'FR' | 'BE' | 'CH' | 'LU'

export interface CountryConfig {
  code: CountryCode
  name: string
  nameLocal: string
  currency: 'EUR' | 'CHF'
  price: number // en centimes
  priceDisplay: string
  vatRate: number // TVA applicable
  legalName: string
  legalMentions: string[]
  gdprLaw: string
  barreauRequired: boolean
  caseTypes: CaseTypeConfig[]
  documentTypes: string[]
  phonePrefix: string
  dateFormat: string
}

export interface CaseTypeConfig {
  id: string
  name: string
  description?: string
  subTypes?: string[]
}

// Configuration par pays
export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  // ============================================
  // FRANCE
  // ============================================
  FR: {
    code: 'FR',
    name: 'France',
    nameLocal: 'France',
    currency: 'EUR',
    price: 14900, // 149€
    priceDisplay: '149 €',
    vatRate: 20,
    legalName: 'Conformément au RGPD et à la loi Informatique et Libertés',
    legalMentions: [
      'Les données sont traitées conformément au RGPD (Règlement UE 2016/679)',
      'Droit d\'accès, de rectification et de suppression (art. 15-17 RGPD)',
      'Conservation limitée à 7 jours après transmission',
      'Responsable de traitement : l\'avocat destinataire',
    ],
    gdprLaw: 'RGPD - Règlement UE 2016/679',
    barreauRequired: true,
    phonePrefix: '+33',
    dateFormat: 'DD/MM/YYYY',
    caseTypes: [
      { id: 'divorce', name: 'Divorce', subTypes: ['Consentement mutuel', 'Acceptation', 'Faute', 'Rupture vie commune'] },
      { id: 'succession', name: 'Succession', subTypes: ['Testament', 'Héritage', 'Partage'] },
      { id: 'immobilier', name: 'Immobilier', subTypes: ['Achat', 'Vente', 'Location', 'Copropriété'] },
      { id: 'travail', name: 'Droit du travail', subTypes: ['Licenciement', 'Rupture conventionnelle', 'Harcelèment', 'Salaires'] },
      { id: 'famille', name: 'Droit de la famille', subTypes: ['Garde d\'enfants', 'Pension alimentaire', 'Adoption'] },
      { id: 'penal', name: 'Droit pénal', subTypes: ['Défense', 'Victime', 'Appel'] },
      { id: 'commerce', name: 'Droit commercial', subTypes: ['Création entreprise', 'Litige commercial', 'Fusion'] },
      { id: 'autre', name: 'Autre' },
    ],
    documentTypes: [
      'Pièce d\'identité (CNI/Passeport)',
      'Livret de famille',
      'Acte de mariage',
      'Acte de naissance',
      'Bulletins de salaire',
      'Avis d\'imposition',
      'Titre de propriété',
      'Relevés bancaires',
      'Contrat de travail',
      'Autre document',
    ],
  },

  // ============================================
  // BELGIQUE
  // ============================================
  BE: {
    code: 'BE',
    name: 'Belgique',
    nameLocal: 'België / Belgique',
    currency: 'EUR',
    price: 15900, // 159€ (légèrement ajusté pour le marché belge)
    priceDisplay: '159 €',
    vatRate: 21,
    legalName: 'Conformément au RGPD et à la loi belge sur la protection des données',
    legalMentions: [
      'Les données sont traitées conformément au RGPD',
      'Droit d\'accès conformément à la loi du 30 juillet 2018',
      'Conservation limitée à 7 jours après transmission',
      'Commission de la protection de la vie privée',
    ],
    gdprLaw: 'RGPD + Loi du 30 juillet 2018',
    barreauRequired: true,
    phonePrefix: '+32',
    dateFormat: 'DD/MM/YYYY',
    caseTypes: [
      { id: 'divorce', name: 'Divorce', subTypes: ['Consentement mutuel', 'Faute', 'Séparation de fait'] },
      { id: 'succession', name: 'Succession', subTypes: ['Testament', 'Héritage', 'Partage'] },
      { id: 'immobilier', name: 'Immobilier', subTypes: ['Achat', 'Vente', 'Bail'] },
      { id: 'travail', name: 'Droit du travail', subTypes: ['Licenciement', 'Rupture', 'Clause de non-concurrence'] },
      { id: 'famille', name: 'Droit de la famille', subTypes: ['Autorité parentale', 'Pension alimentaire'] },
      { id: 'penal', name: 'Droit pénal' },
      { id: 'entreprise', name: 'Droit des affaires' },
      { id: 'autre', name: 'Autre' },
    ],
    documentTypes: [
      'Carte d\'identité',
      'Acte de naissance',
      'Acte de mariage',
      'Fiche de salaire',
      'Avertissement-extrait de rôle',
      'Titre de propriété',
      'Extrait bancaire',
      'Contrat de travail',
      'Autre document',
    ],
  },

  // ============================================
  // SUISSE
  // ============================================
  CH: {
    code: 'CH',
    name: 'Suisse',
    nameLocal: 'Schweiz / Suisse / Svizzera',
    currency: 'CHF',
    price: 14900, // 149 CHF
    priceDisplay: '149 CHF',
    vatRate: 8.1, // TVA suisse
    legalName: 'Conformément à la LPD (Loi fédérale sur la protection des données)',
    legalMentions: [
      'Protection des données selon la LPD (RS 235.1)',
      'Droit d\'accès selon l\'art. 8 LPD',
      'Conservation limitée à 7 jours',
      'Principe de la proportionnalité respecté',
    ],
    gdprLaw: 'LPD - Loi fédérale du 19 juin 1992',
    barreauRequired: true,
    phonePrefix: '+41',
    dateFormat: 'DD.MM.YYYY',
    caseTypes: [
      { id: 'divorce', name: 'Divorce', subTypes: ['Consentement mutuel', 'Unilatéral'] },
      { id: 'succession', name: 'Succession', subTypes: ['Testament', 'Héritage', 'Partage'] },
      { id: 'immobilier', name: 'Immobilier', subTypes: ['Achat', 'Vente', 'Bail'] },
      { id: 'travail', name: 'Droit du travail', subTypes: ['Résiliation', 'Congé', 'Licenciement'] },
      { id: 'famille', name: 'Droit de la famille', subTypes: ['Garde', 'Pension', 'Adoption'] },
      { id: 'penal', name: 'Droit pénal' },
      { id: 'dette', name: 'Poursuites et faillites' },
      { id: 'autre', name: 'Autre' },
    ],
    documentTypes: [
      'Permis de séjour / Carte d\'identité',
      'Acte d\'origine',
      'Certificat de famille',
      'Bulletin de salaire',
      'Certificat de salaire',
      'Extrait du registre foncier',
      'Extrait bancaire',
      'Contrat de travail',
      'Autre document',
    ],
  },

  // ============================================
  // LUXEMBOURG
  // ============================================
  LU: {
    code: 'LU',
    name: 'Luxembourg',
    nameLocal: 'Lëtzebuerg',
    currency: 'EUR',
    price: 16900, // 169€ (marché luxembourgeois)
    priceDisplay: '169 €',
    vatRate: 17,
    legalName: 'Conformément au RGPD et à la loi luxembourgeoise sur la protection des données',
    legalMentions: [
      'Protection des données selon le RGPD',
      'Loi du 1er août 2018 transposant le RGPD',
      'CNPD - Commission nationale pour la protection des données',
      'Conservation limitée à 7 jours',
    ],
    gdprLaw: 'RGPD + Loi du 1er août 2018',
    barreauRequired: true,
    phonePrefix: '+352',
    dateFormat: 'DD/MM/YYYY',
    caseTypes: [
      { id: 'divorce', name: 'Divorce', subTypes: ['Consentement mutuel', 'Faute', 'Séparation'] },
      { id: 'succession', name: 'Succession', subTypes: ['Testament', 'Héritage', 'Partage'] },
      { id: 'immobilier', name: 'Immobilier', subTypes: ['Achat', 'Vente', 'Bail'] },
      { id: 'travail', name: 'Droit du travail', subTypes: ['Licenciement', 'Rupture', 'Harcelèment'] },
      { id: 'famille', name: 'Droit de la famille' },
      { id: 'societes', name: 'Droit des sociétés' },
      { id: 'fiscal', name: 'Droit fiscal' },
      { id: 'autre', name: 'Autre' },
    ],
    documentTypes: [
      'Carte d\'identité / Passeport',
      'Certificat de naissance',
      'Certificat de mariage',
      'Fiche de salaire',
      'Certificat de rémunération',
      'Titre de propriété',
      'Relevé bancaire',
      'Contrat de travail',
      'Autre document',
    ],
  },
}

// Prix par pays (en centimes)
export const PRICES: Record<CountryCode, { amount: number; currency: string; display: string }> = {
  FR: { amount: 14900, currency: 'EUR', display: '149 €' },
  BE: { amount: 15900, currency: 'EUR', display: '159 €' },
  CH: { amount: 14900, currency: 'CHF', display: '149 CHF' },
  LU: { amount: 16900, currency: 'EUR', display: '169 €' },
}

// Commission avocat (20%)
export const COMMISSION_RATE = 0.20

// Obtenir la commission pour un pays
export function getCommission(country: CountryCode): { amount: number; display: string } {
  const price = PRICES[country]
  const commissionAmount = Math.round(price.amount * COMMISSION_RATE)
  return {
    amount: commissionAmount,
    display: `${(commissionAmount / 100).toFixed(2)} ${price.currency}`,
  }
}

// Devise par pays
export const CURRENCIES: Record<CountryCode, { symbol: string; code: string; locale: string }> = {
  FR: { symbol: '€', code: 'EUR', locale: 'fr-FR' },
  BE: { symbol: '€', code: 'EUR', locale: 'fr-BE' },
  CH: { symbol: 'CHF', code: 'CHF', locale: 'fr-CH' },
  LU: { symbol: '€', code: 'EUR', locale: 'fr-LU' },
}

// Liste des pays pour le sélecteur
export const COUNTRY_OPTIONS = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
] as const
