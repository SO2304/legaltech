// ============================================
// API: WEBHOOK N8N - RÉCEPTION ANALYSE IA
// Point d'entrée pour les callbacks n8n
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateNotificationEmail, generateConfirmationEmail } from '@/lib/email'
import type { 
  WebhookAnalysisPayload, 
  WebhookEmailPayload, 
  WebhookEventType 
} from '@/types'
import { createHmac } from 'crypto'

// Vérification de la signature du webhook
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  // Vérifier le timestamp (anti-replay, 5 minutes max)
  const now = Date.now()
  const webhookTime = parseInt(timestamp, 10)
  if (Math.abs(now - webhookTime) > 5 * 60 * 1000) {
    return false
  }
  
  // Vérifier la signature HMAC
  const expectedSignature = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex')
  
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Récupérer les headers
    const eventType = request.headers.get('x-event-type') as WebhookEventType | null
    const timestamp = request.headers.get('x-timestamp')
    const signature = request.headers.get('x-signature')
    const rawBody = await request.text()
    
    // Validation des headers
    if (!eventType || !timestamp || !signature) {
      return NextResponse.json(
        { success: false, error: 'Headers manquants' },
        { status: 400 }
      )
    }
    
    // Parser le body
    const payload = JSON.parse(rawBody)
    
    // Récupérer le dossier pour obtenir le secret de l'avocat
    const dossier = await prisma.dossier.findUnique({
      where: { id: payload.dossierId },
      include: { avocat: true, client: true },
    })
    
    if (!dossier) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }
    
    // Vérifier la signature
    if (!verifyWebhookSignature(rawBody, signature, dossier.avocat.webhookSecret, timestamp)) {
      return NextResponse.json(
        { success: false, error: 'Signature invalide' },
        { status: 401 }
      )
    }
    
    // Traiter selon le type d'événement
    let response: Record<string, unknown> = {}
    
    switch (eventType) {
      case 'ANALYSIS_COMPLETE':
        response = await handleAnalysisComplete(payload as WebhookAnalysisPayload, dossier)
        break
        
      case 'EMAIL_SENT':
        response = await handleEmailSent(payload as WebhookEmailPayload, dossier)
        break
        
      default:
        return NextResponse.json(
          { success: false, error: `Type d'événement non supporté: ${eventType}` },
          { status: 400 }
        )
    }
    
    // Logger l'événement
    const processingTime = Date.now() - startTime
    await prisma.webhookEvent.create({
      data: {
        type: eventType,
        payload,
        response,
        statut: 'TRAITE',
        tempsTraitement: processingTime,
        dossierId: dossier.id,
        processedAt: new Date(),
      },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Webhook traité avec succès',
      processedAt: new Date().toISOString(),
      processingTime,
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    )
  }
}

// Handler pour ANALYSIS_COMPLETE
async function handleAnalysisComplete(
  payload: WebhookAnalysisPayload,
  dossier: NonNullable<Awaited<ReturnType<typeof prisma.dossier.findUnique>>>
) {
  // Mettre à jour le dossier avec les résultats de l'analyse
  await prisma.dossier.update({
    where: { id: dossier.id },
    data: {
      statut: 'ANALYSE_TERMINEE',
      analyseIA: payload.analysis,
      syntheseHTML: payload.syntheseHTML,
      dateAnalyse: new Date(),
    },
  })
  
  // Envoyer l'email à l'avocat
  const { subject, html } = generateNotificationEmail(
    dossier.avocat,
    dossier,
    payload.syntheseHTML
  )
  
  const emailResult = await sendEmail({
    to: dossier.avocat.email,
    subject,
    html,
    replyTo: dossier.client.email,
  })
  
  // Envoyer email de confirmation au client
  const clientEmail = generateConfirmationEmail(
    dossier.client.email,
    `${dossier.client.prenom} ${dossier.client.nom}`,
    dossier.reference
  )
  
  await sendEmail({
    to: dossier.client.email,
    subject: clientEmail.subject,
    html: clientEmail.html,
  })
  
  return {
    analysisUpdated: true,
    emailsSent: {
      avocat: emailResult.success,
      client: true,
    },
  }
}

// Handler pour EMAIL_SENT
async function handleEmailSent(
  payload: WebhookEmailPayload,
  dossier: NonNullable<Awaited<ReturnType<typeof prisma.dossier.findUnique>>>
) {
  // Mettre à jour le statut si notification avocat
  if (payload.emailType === 'NOTIFICATION_AVOCAT') {
    await prisma.dossier.update({
      where: { id: dossier.id },
      data: {
        statut: 'NOTIFIE',
        dateNotification: new Date(),
      },
    })
  }
  
  return {
    emailConfirmed: true,
    type: payload.emailType,
  }
}
