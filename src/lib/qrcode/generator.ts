// ============================================
// FLASHJURIS - SERVICE QR CODE
// Génération automatique des QR codes
// ============================================

import QRCode from 'qrcode'

export interface QRCodeResult {
  url: string
  imageBase64: string
  lawyerId: string
}

// URL de base de l'application
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://flashjuris.com'

/**
 * Génère un QR code unique pour un avocat
 */
export async function generateLawyerQRCode(lawyerId: string): Promise<QRCodeResult> {
  const url = `${BASE_URL}/scan/${lawyerId}`
  
  // Générer l'image QR code en base64
  const imageBase64 = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1e40af', // Bleu foncé
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  })
  
  return {
    url,
    imageBase64,
    lawyerId,
  }
}

/**
 * Génère un QR code avec le logo FlashJuris
 */
export async function generateBrandedQRCode(lawyerId: string): Promise<QRCodeResult> {
  const url = `${BASE_URL}/scan/${lawyerId}`
  
  // QR code avec design personnalisé
  const imageBase64 = await QRCode.toDataURL(url, {
    width: 500,
    margin: 3,
    color: {
      dark: '#1e3a8a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
    rendererOpts: {
      quality: 1,
    },
  })
  
  return {
    url,
    imageBase64,
    lawyerId,
  }
}

/**
 * Valide un ID d'avocat depuis un QR code
 */
export function parseQRCodeUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/scan\/([a-z0-9]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Génère un QR code pour impression (haute résolution)
 */
export async function generatePrintableQRCode(lawyerId: string): Promise<Buffer> {
  const url = `${BASE_URL}/scan/${lawyerId}`
  
  return QRCode.toBuffer(url, {
    width: 800,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  })
}
