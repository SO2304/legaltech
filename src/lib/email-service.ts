// ============================================
// FLASHJURIS - SERVICE EMAIL
// Envoi des rapports via Resend/SendGrid
// ============================================

interface AnalysisReport {
  lawyer: {
    id: string
    name: string
    email: string
    firm: string | null
  }
  caseReference: string
  clientName: string | null
  caseType: string | null
  analysis: {
    summary: string
    keyPoints: string[]
    risks: string[]
    recommendations: string[]
    nextSteps: string[]
  }
}

/**
 * Envoie le rapport d'analyse à l'avocat
 */
export async function sendAnalysisReport(caseId: string, report: AnalysisReport): Promise<boolean> {
  console.log(`Sending report to ${report.lawyer.email} for case ${caseId}`)
  
  const htmlContent = generateReportEmailHTML(report)
  const textContent = generateReportEmailText(report)
  
  // En production, utiliser Resend ou SendGrid
  // Pour l'instant, on simule l'envoi
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FlashJuris <rapports@flashjuris.com>',
          to: report.lawyer.email,
          subject: `📊 Rapport d'analyse - ${report.caseReference}`,
          html: htmlContent,
          text: textContent,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Resend error: ${response.statusText}`)
      }
      
      console.log(`Report sent successfully to ${report.lawyer.email}`)
      return true
      
    } catch (error) {
      console.error('Failed to send email via Resend:', error)
      return false
    }
  }
  
  // Mode développement: logger l'email
  console.log('=== EMAIL REPORT (DEV MODE) ===')
  console.log(`To: ${report.lawyer.email}`)
  console.log(`Subject: Rapport d'analyse - ${report.caseReference}`)
  console.log('================================')
  
  return true
}

/**
 * Génère le HTML du rapport
 */
function generateReportEmailHTML(report: AnalysisReport): string {
  const { lawyer, caseReference, clientName, caseType, analysis } = report
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'analyse FlashJuris</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ⚡ FlashJuris
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                Rapport d'analyse IA
              </p>
            </td>
          </tr>
          
          <!-- Reference -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f1f5f9; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                Référence du dossier
              </p>
              <p style="margin: 8px 0 0; font-size: 24px; font-weight: 700; color: #1e293b; font-family: monospace;">
                ${caseReference}
              </p>
            </td>
          </tr>
          
          <!-- Client Info -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 18px;">
                Informations client
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Client</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">
                    ${clientName || 'Non renseigné'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Type d'affaire</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;">
                    ${caseType || 'Non spécifié'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Summary -->
          ${analysis.summary ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 10px; color: #1e40af; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Résumé synthétique
                </h3>
                <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6;">
                  ${analysis.summary}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}
          
          <!-- Key Points -->
          ${analysis.keyPoints.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px;">
                📌 Points clés
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                ${analysis.keyPoints.map(point => `<li>${point}</li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}
          
          <!-- Risks -->
          ${analysis.risks.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; color: #dc2626; font-size: 16px;">
                ⚠️ Risques identifiés
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                ${analysis.risks.map(risk => `<li>${risk}</li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}
          
          <!-- Recommendations -->
          ${analysis.recommendations.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px;">
                💡 Recommandations
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}
          
          <!-- Next Steps -->
          ${analysis.nextSteps.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 40px;">
              <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px;">
                🎯 Prochaines étapes
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                ${analysis.nextSteps.map(step => `<li>${step}</li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px;">
                Ce rapport a été généré automatiquement par l'IA de FlashJuris.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                FlashJuris - Analyse juridique intelligente<br>
                ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Génère la version texte du rapport
 */
function generateReportEmailText(report: AnalysisReport): string {
  const { caseReference, clientName, caseType, analysis } = report
  
  let text = `
RAPPORT D'ANALYSE FLASHJURIS
============================
Référence: ${caseReference}

CLIENT: ${clientName || 'Non renseigné'}
TYPE: ${caseType || 'Non spécifié'}

`
  
  if (analysis.summary) {
    text += `RÉSUMÉ\n------\n${analysis.summary}\n\n`
  }
  
  if (analysis.keyPoints.length > 0) {
    text += `POINTS CLÉS\n------------\n${analysis.keyPoints.map(p => `• ${p}`).join('\n')}\n\n`
  }
  
  if (analysis.risks.length > 0) {
    text += `RISQUES\n-------\n${analysis.risks.map(r => `• ${r}`).join('\n')}\n\n`
  }
  
  if (analysis.recommendations.length > 0) {
    text += `RECOMMANDATIONS\n---------------\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}\n\n`
  }
  
  if (analysis.nextSteps.length > 0) {
    text += `PROCHAINES ÉTAPES\n-----------------\n${analysis.nextSteps.map(s => `• ${s}`).join('\n')}\n\n`
  }
  
  text += `---\nFlashJuris - Analyse juridique intelligente\n${new Date().toLocaleDateString('fr-FR')}`
  
  return text.trim()
}

/**
 * Envoie l'email de bienvenue avec le QR code
 */
export async function sendWelcomeEmail(lawyer: {
  id: string
  email: string
  name: string
  qrCodeImage: string
}): Promise<boolean> {
  console.log(`Sending welcome email to ${lawyer.email}`)
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bienvenue sur FlashJuris</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                ⚡ Bienvenue sur FlashJuris
              </h1>
              <p style="margin: 15px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Bonjour ${lawyer.name}, votre compte est prêt !
              </p>
            </td>
          </tr>
          
          <!-- QR Code -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 18px; font-weight: 600;">
                Votre QR Code personnel
              </p>
              <img src="${lawyer.qrCodeImage}" alt="QR Code" style="max-width: 250px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
              <p style="margin: 25px 0 0; color: #64748b; font-size: 14px;">
                Imprimez ce QR code et posez-le sur votre bureau.<br>
                Vos clients pourront scanner pour déposer leurs documents.
              </p>
            </td>
          </tr>
          
          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 25px;">
                <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px;">
                  Comment ça marche ?
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
                  <li>Le client scanne votre QR code</li>
                  <li>Il remplit ses informations et upload ses documents</li>
                  <li>Vous recevez le rapport d'analyse directement par email</li>
                </ol>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                FlashJuris - L'analyse juridique en un scan
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
  
  // En production avec Resend
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FlashJuris <bienvenue@flashjuris.com>',
          to: lawyer.email,
          subject: '⚡ Votre QR Code FlashJuris est prêt !',
          html: htmlContent,
        }),
      })
      return true
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return false
    }
  }
  
  console.log('=== WELCOME EMAIL (DEV MODE) ===')
  console.log(`To: ${lawyer.email}`)
  console.log('================================')
  
  return true
}
