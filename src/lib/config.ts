// ============================================
// CONFIGURATION DE L'APPLICATION
// Centralisée et typée
// ============================================

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

export const config = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromAddress: process.env.EMAIL_FROM || 'noreply@flashjuris.com',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  
  security: {
    cronSecret: process.env.CRON_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    webhookSecret: process.env.WEBHOOK_SECRET || 'dev-secret',
  },
  
  retention: {
    documentDays: 7,
    consentMonths: 24,
  },
} as const

// ============================================
// DOCUMENT TYPES
// ============================================

// Types de documents requis pour un dossier de divorce complet
export const REQUIRED_DOCUMENTS = {
  identite: [
    { type: 'CARTE_IDENTITE_EPOUX' as const, label: 'Carte d\'identité (Époux)', required: true },
    { type: 'CARTE_IDENTITE_EPOUSE' as const, label: 'Carte d\'identité (Épouse)', required: true },
  ],
  etatCivil: [
    { type: 'ACTE_MARIAGE' as const, label: 'Acte de mariage', required: true },
    { type: 'LIVRET_FAMILLE' as const, label: 'Livret de famille', required: true },
    { type: 'ACTE_NAISSANCE_ENFANTS' as const, label: 'Acte(s) de naissance des enfants', required: false, condition: 'hasEnfants' },
  ],
  financier: [
    { type: 'AVIS_IMPOSITION' as const, label: 'Avis d\'imposition (dernier)', required: true },
    { type: 'BULLETIN_SALAIRE_EPOUX' as const, label: 'Bulletins de salaire (Époux - 3 derniers)', required: true },
    { type: 'BULLETIN_SALAIRE_EPOUSE' as const, label: 'Bulletins de salaire (Épouse - 3 derniers)', required: true },
  ],
  patrimoine: [
    { type: 'TITRE_PROPRIETE' as const, label: 'Titre de propriété', required: false, condition: 'hasImmobilier' },
    { type: 'RELEVE_BANCAIRE' as const, label: 'Relevés bancaires (3 derniers)', required: true },
    { type: 'RELEVE_EPARGNE' as const, label: 'Relevés d\'épargne', required: false },
    { type: 'RELEVE_ASSURANCE_VIE' as const, label: 'Relevés d\'assurance vie', required: false },
  ],
  dettes: [
    { type: 'PRET_IMMOBILIER' as const, label: 'Tableau d\'amortissement prêt immobilier', required: false, condition: 'hasPretImmobilier' },
    { type: 'PRET_CONSOMMATION' as const, label: 'Prêts à la consommation', required: false },
    { type: 'DETTES' as const, label: 'Autres dettes', required: false },
  ],
}

// Taux de commission par défaut
export const DEFAULT_COMMISSION_RATE = 20

// Durée de rétention des documents (en jours)
export const DOCUMENT_RETENTION_DAYS = 7

// Durée de validité du consentement RGPD (en mois)
export const CONSENT_VALIDITY_MONTHS = 24

// Formats de fichiers acceptés
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

// Taille maximale des fichiers (en bytes) - 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Extension de fichiers autorisées
export const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']

// URL du webhook n8n
export const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/divorce'

// Secret pour signer les webhooks
export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-secret'

// Regex de validation
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  telephone: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
  codePostal: /^\d{5}$/,
  slug: /^[a-z0-9-]+$/,
}

// Messages d'erreur
export const ERROR_MESSAGES = {
  invalidEmail: 'Veuillez entrer une adresse email valide',
  invalidTelephone: 'Veuillez entrer un numéro de téléphone valide',
  invalidCodePostal: 'Veuillez entrer un code postal valide (5 chiffres)',
  requiredField: 'Ce champ est obligatoire',
  fileSizeTooLarge: `Le fichier est trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
  invalidFileType: 'Format de fichier non accepté (PDF, JPG, PNG, WEBP)',
  consentRequired: 'Vous devez accepter les conditions pour continuer',
}
