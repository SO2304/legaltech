// ============================================
// SERVICE EMAIL
// Envoi des notifications aux avocats
// ============================================

import type { DossierInfo, AvocatPublic } from '@/types'

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Envoie un email via l'API Resend ou SendGrid
 * Configurable selon les variables d'environnement
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, replyTo } = options
  
  // Mode développement: log seulement
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email (dev mode):', { to, subject })
    return { success: true, messageId: `dev-${Date.now()}` }
  }
  
  // Utilisation de Resend si configuré
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(options)
  }
  
  // Fallback: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return sendWithSendGrid(options)
  }
  
  throw new Error('No email provider configured')
}

async function sendWithResend(options: EmailOptions): Promise<EmailResult> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'noreply@divorce-saas.fr',
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    return { success: false, error }
  }
  
  const data = await response.json()
  return { success: true, messageId: data.id }
}

async function sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: process.env.EMAIL_FROM || 'noreply@divorce-saas.fr' },
      subject: options.subject,
      content: [{ type: 'text/html', value: options.html }],
      reply_to: options.replyTo ? { email: options.replyTo } : undefined,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    return { success: false, error }
  }
  
  return { success: true, messageId: response.headers.get('X-Message-Id') || undefined }
}

// ============================================
// TEMPLATES D'EMAILS
// ============================================

export function generateNotificationEmail(
  avocat: AvocatPublic,
  dossier: DossierInfo,
  syntheseHTML: string
): { subject: string; html: string } {
  const subject = `Nouveau dossier de divorce - ${dossier.reference}`
  
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouveau dossier de divorce</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              Nouveau dossier de divorce
            </h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 16px;">
              Référence: ${dossier.reference}
            </p>
          </td>
        </tr>
        
        <tr>
          <td style="background: white; padding: 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
              Maître ${avocat.prenom} ${avocat.nom},
            </p>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
              Un nouveau dossier de divorce par consentement mutuel a été soumis via votre formulaire. 
              Veuillez trouver ci-dessous la synthèse réalisée par notre système d'analyse.
            </p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1e3a5f;">
                Synthèse du dossier
              </h2>
              ${syntheseHTML}
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⚠️ Note importante :</strong> Les documents joints à ce dossier seront automatiquement supprimés 
                dans 7 jours conformément à notre politique de confidentialité RGPD.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1e3a5f;">
                Informations de contact
              </h3>
              <p style="margin: 0; font-size: 14px; color: #666;">
                Email: ${dossier.client?.email || 'Non renseigné'}<br>
                Téléphone: ${dossier.client?.telephone || 'Non renseigné'}
              </p>
            </div>
          </td>
        </tr>
        
        <tr>
          <td style="background: #1e3a5f; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6);">
              Cet email a été envoyé automatiquement par Divorce SaaS LegalTech.<br>
              Commission applicable: 20% sur ce dossier.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
  
  return { subject, html }
}

export function generateConfirmationEmail(
  clientEmail: string,
  clientNom: string,
  reference: string
): { subject: string; html: string } {
  const subject = `Confirmation de votre demande - ${reference}`
  
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de votre demande</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              ✓ Demande bien reçue
            </h1>
          </td>
        </tr>
        
        <tr>
          <td style="background: white; padding: 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
              Bonjour ${clientNom},
            </p>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
              Nous avons bien reçu votre demande de divorce. Votre dossier a été transmis à l'avocat 
              que vous avez sélectionné.
            </p>
            
            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #166534;">
                Votre référence de dossier
              </p>
              <p style="margin: 0; font-size: 24px; font-weight: 600; color: #059669;">
                ${reference}
              </p>
            </div>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
              L'avocat analysera votre dossier et reviendra vers vous dans les meilleurs délais.
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Rappel :</strong> Vos documents seront automatiquement supprimés de nos serveurs 
                dans 7 jours pour des raisons de confidentialité.
              </p>
            </div>
          </td>
        </tr>
        
        <tr>
          <td style="background: #059669; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8);">
              Merci de votre confiance.<br>
              Divorce SaaS LegalTech
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
  
  return { subject, html }
}
