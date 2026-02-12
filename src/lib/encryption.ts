// ============================================
// SERVICE DE CHIFFREMENT
// AES-256-GCM pour les documents sensibles
// ============================================

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Récupération de la clé de chiffrement depuis les variables d'environnement
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY not set in environment variables')
  }
  // La clé doit faire 32 bytes (256 bits)
  return createHash('sha256').update(key).digest()
}

/**
 * Chiffre un buffer avec AES-256-GCM
 * @param data - Données à chiffrer
 * @returns Objet contenant les données chiffrées et l'IV
 */
export function encryptBuffer(data: Buffer): { encrypted: Buffer; iv: string } {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ])
  
  return {
    encrypted,
    iv: iv.toString('hex'),
  }
}

/**
 * Déchiffre un buffer avec AES-256-GCM
 * @param encryptedData - Données chiffrées (avec auth tag)
 * @param ivHex - IV en hexadécimal
 * @returns Données déchiffrées
 */
export function decryptBuffer(encryptedData: Buffer, ivHex: string): Buffer {
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  
  // Séparer les données chiffrées de l'auth tag
  const authTag = encryptedData.subarray(-AUTH_TAG_LENGTH)
  const data = encryptedData.subarray(0, -AUTH_TAG_LENGTH)
  
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  return Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ])
}

/**
 * Calcule le hash SHA-256 d'un fichier
 * @param data - Données du fichier
 * @returns Hash en hexadécimal
 */
export function calculateHash(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Génère un nom de fichier sécurisé et unique
 * @param originalName - Nom original du fichier
 * @returns Nom sécurisé avec extension
 */
export function generateSecureFilename(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
  const randomId = randomBytes(16).toString('hex')
  const timestamp = Date.now().toString(36)
  return `${timestamp}_${randomId}.${ext}`
}

/**
 * Génère un secret pour les webhooks
 * @returns Secret de 32 caractères
 */
export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex')
}
