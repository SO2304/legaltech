// ============================================
// FLASHJURIS - SERVICE MÉTIER DOSSIERS
// Logique métier séparée des routes API
// ============================================

import { prisma } from '@/lib/prisma'
import { AuditService } from '@/lib/audit-service'
import { RGPDService } from '@/lib/rgpd-service'
import { 
  generateReference, 
  formatPrice, 
  calculateCommission,
  addDays 
} from '@/lib/utils'

// Pays supportés
export type CountryCode = 'FR' | 'BE' | 'CH' | 'LU'

// Configuration par pays
export const COUNTRY_CONFIG: Record<CountryCode, {
  name: string
  priceCents: number
  currency: 'EUR' | 'CHF'
  locale: string
  caseTypes: string[]
}> = {
  FR: {
    name: 'France',
    priceCents: 14900,
    currency: 'EUR',
    locale: 'fr-FR',
    caseTypes: [
      'divorce_consentement_mutuel',
      'divorce_acceptation_principe',
      'divorce_faute',
      'divorce_rupture_vie_commune',
      'succession',
      'autre',
    ],
  },
  BE: {
    name: 'Belgique',
    priceCents: 15900,
    currency: 'EUR',
    locale: 'fr-BE',
    caseTypes: [
      'divorce_mutuel',
      'divorce_irremediablement_desuni',
      'separation',
      'succession',
      'autre',
    ],
  },
  CH: {
    name: 'Suisse',
    priceCents: 14900,
    currency: 'CHF',
    locale: 'fr-CH',
    caseTypes: [
      'divorce_mutuel',
      'divorce_unilateral',
      'succession',
      'autre',
    ],
  },
  LU: {
    name: 'Luxembourg',
    priceCents: 16900,
    currency: 'EUR',
    locale: 'fr-LU',
    caseTypes: [
      'divorce_mutuel',
      'divorce_faute',
      'succession',
      'autre',
    ],
  },
}

// Interface pour la création de dossier
export interface CreateCaseInput {
  lawyerId: string
  country?: CountryCode
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  clientCity?: string
  clientPostalCode?: string
  caseType?: string
  caseDescription?: string
}

// Interface du dossier
export interface CaseInfo {
  id: string
  reference: string
  status: string
  country: string
  clientName: string | null
  caseType: string | null
  priceCents: number
  priceCurrency: string
  commissionAmount: number
  createdAt: Date
  purgeAt: Date
  isPurged: boolean
}

/**
 * Service métier pour la gestion des dossiers
 */
export class CaseService {
  /**
   * Crée un nouveau dossier
   */
  static async create(input: CreateCaseInput): Promise<CaseInfo> {
    const country = input.country || 'FR'
    const config = COUNTRY_CONFIG[country]
    const reference = generateReference('FJ')
    
    // Calculer la commission (20%)
    const commissionAmount = calculateCommission(config.priceCents, 20)
    
    const caseData = await prisma.case.create({
      data: {
        reference,
        lawyerId: input.lawyerId,
        country,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        clientAddress: input.clientAddress,
        clientCity: input.clientCity,
        clientPostalCode: input.clientPostalCode,
        caseType: input.caseType,
        caseDescription: input.caseDescription,
        priceCents: config.priceCents,
        priceCurrency: config.currency,
        commissionAmount,
        commissionCurrency: config.currency,
        purgeAt: addDays(new Date(), 7),
        status: 'pending',
      },
    })
    
    // Audit
    await AuditService.log({
      action: 'case_created',
      entityType: 'case',
      entityId: caseData.id,
      caseId: caseData.id,
      lawyerId: input.lawyerId,
      newValues: {
        reference,
        country,
        caseType: input.caseType,
      },
      changes: `Nouveau dossier créé: ${reference}`,
    })
    
    return caseData
  }

  /**
   * Récupère un dossier par ID
   */
  static async getById(caseId: string): Promise<CaseInfo | null> {
    return prisma.case.findUnique({
      where: { id: caseId },
    })
  }

  /**
   * Récupère un dossier par référence
   */
  static async getByReference(reference: string): Promise<CaseInfo | null> {
    return prisma.case.findUnique({
      where: { reference },
    })
  }

  /**
   * Met à jour le statut d'un dossier
   */
  static async updateStatus(
    caseId: string, 
    newStatus: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { status: true, lawyerId: true },
    })
    
    if (!caseData) {
      throw new Error('Dossier non trouvé')
    }
    
    await prisma.case.update({
      where: { id: caseId },
      data: { status: newStatus },
    })
    
    // Audit
    await AuditService.log({
      action: 'case_updated',
      entityType: 'case',
      entityId: caseId,
      caseId,
      lawyerId: caseData.lawyerId,
      oldValues: { status: caseData.status },
      newValues: { status: newStatus },
      changes: `Statut changé de "${caseData.status}" vers "${newStatus}"`,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    })
  }

  /**
   * Enregistre un paiement réussi
   */
  static async recordPayment(
    caseId: string,
    paymentIntentId: string
  ): Promise<void> {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
    })
    
    if (!caseData) {
      throw new Error('Dossier non trouvé')
    }
    
    await prisma.case.update({
      where: { id: caseId },
      data: {
        stripePaymentIntent: paymentIntentId,
        paymentStatus: 'succeeded',
        paidAt: new Date(),
        status: 'paid',
      },
    })
    
    // Audit
    await AuditService.log({
      action: 'payment_success',
      entityType: 'case',
      entityId: caseId,
      caseId,
      lawyerId: caseData.lawyerId,
      newValues: {
        amount: caseData.priceCents,
        currency: caseData.priceCurrency,
      },
      changes: `Paiement réussi: ${formatPrice(caseData.priceCents, caseData.priceCurrency)}`,
    })
    
    // Event pour analytics
    await prisma.event.create({
      data: {
        type: 'payment_success',
        lawyerId: caseData.lawyerId,
        caseId,
        country: caseData.country,
        metadata: JSON.stringify({
          amount: caseData.priceCents,
          currency: caseData.priceCurrency,
        }),
      },
    })
  }

  /**
   * Marque l'email comme envoyé
   */
  static async markEmailSent(caseId: string): Promise<void> {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        emailSentAt: new Date(),
        status: 'sent',
      },
    })
    
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { lawyerId: true },
    })
    
    if (caseData) {
      await AuditService.log({
        action: 'email_sent',
        entityType: 'case',
        entityId: caseId,
        caseId,
        lawyerId: caseData.lawyerId,
        changes: 'Documents envoyés à l\'avocat',
      })
    }
  }

  /**
   * Marque l'email comme ouvert
   */
  static async markEmailOpened(caseId: string): Promise<void> {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        emailOpened: true,
        emailOpenedAt: new Date(),
      },
    })
    
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { lawyerId: true },
    })
    
    if (caseData) {
      await AuditService.log({
        action: 'email_opened',
        entityType: 'case',
        entityId: caseId,
        caseId,
        lawyerId: caseData.lawyerId,
        changes: 'Email ouvert par l\'avocat',
      })
    }
  }

  /**
   * Récupère les dossiers d'un avocat
   */
  static async listByLawyer(
    lawyerId: string,
    options?: { status?: string; limit?: number }
  ): Promise<CaseInfo[]> {
    return prisma.case.findMany({
      where: {
        lawyerId,
        status: options?.status,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
    })
  }

  /**
   * Statistiques d'un avocat
   */
  static async getLawyerStats(lawyerId: string): Promise<{
    totalCases: number
    pendingCases: number
    paidCases: number
    totalCommission: number
    thisMonth: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const [totalCases, pendingCases, paidCases, paidCasesData, thisMonth] = await Promise.all([
      prisma.case.count({ where: { lawyerId } }),
      prisma.case.count({ where: { lawyerId, status: 'pending' } }),
      prisma.case.count({ where: { lawyerId, paymentStatus: 'succeeded' } }),
      prisma.case.findMany({
        where: { lawyerId, paymentStatus: 'succeeded' },
        select: { commissionAmount: true },
      }),
      prisma.case.count({
        where: {
          lawyerId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ])
    
    const totalCommission = paidCasesData.reduce(
      (sum, c) => sum + (c.commissionAmount || 0),
      0
    )
    
    return {
      totalCases,
      pendingCases,
      paidCases,
      totalCommission,
      thisMonth,
    }
  }
}
