'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, Loader2 } from 'lucide-react'
import { Pays, DocumentType, Document } from '@prisma/client'
import { DocumentValidation } from './DocumentValidation'
import { SmartSourcingLink } from './SmartSourcingLink'
import { detectDocumentType } from '@/lib/ocr-service'
import { OCRResult } from '@/lib/ocr-service'

interface DocumentUploaderProps {
  dossierId: string
  pays: Pays
  onUploadComplete?: (document: Document) => void
}

interface UploadedDoc {
  document: Document
  ocr: OCRResult
  validation: {
    estExige: boolean
    articleLoi?: string
    alertes: string[]
  }
}

/**
 * Composant DocumentUploader
 * Zone de drag & drop pour uploader des documents avec OCR et validation automatiques
 */
export function DocumentUploader({ dossierId, pays, onUploadComplete }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDoc[]>([])
  const [error, setError] = useState<string | null>(null)

  const uploadDocument = useCallback(async (file: File) => {
    try {
      setError(null)

      // Détecter le type de document
      const type = detectDocumentType(file.name)

      // Préparer FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dossierId', dossierId)
      formData.append('type', type)
      formData.append('pays', pays)

      // Upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'upload')
      }

      const result = await response.json()

      // Ajouter à la liste
      setUploadedDocuments(prev => [...prev, result])

      // Callback
      if (onUploadComplete) {
        onUploadComplete(result.document)
      }

      return result
    } catch (err) {
      console.error('Erreur upload:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      throw err
    }
  }, [dossierId, pays, onUploadComplete])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      // Upload des fichiers en parallèle
      await Promise.all(acceptedFiles.map(file => uploadDocument(file)))
    } catch (err) {
      // L'erreur est déjà gérée dans uploadDocument
    } finally {
      setUploading(false)
    }
  }, [uploadDocument])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  })

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-white'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-lg font-medium text-gray-700">
                Upload en cours...
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive
                    ? 'Déposez vos documents ici'
                    : 'Glissez vos documents ici'}
                </p>
                <p className="text-sm text-gray-500">
                  ou cliquez pour sélectionner
                </p>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Formats acceptés: PDF, JPG, PNG, DOCX</p>
                <p>Taille maximale: 10 MB par fichier</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Documents recommandés avec liens SmartSourcing */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-3">Documents recommandés:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">Acte de mariage</span>
            </div>
            <SmartSourcingLink pays={pays} type="ACTE_MARIAGE" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">Carte d'identité</span>
            </div>
            <SmartSourcingLink pays={pays} type="CARTE_IDENTITE" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">Bulletins de salaire (3 derniers mois)</span>
            </div>
            <SmartSourcingLink pays={pays} type="BULLETIN_SALAIRE" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">Avis d'imposition</span>
            </div>
            <SmartSourcingLink pays={pays} type="AVIS_IMPOSITION" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">Relevés bancaires</span>
            </div>
            <SmartSourcingLink pays={pays} type="RELEVE_BANCAIRE" />
          </div>
        </div>
      </div>

      {/* Documents uploadés */}
      {uploadedDocuments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">
            Documents uploadés ({uploadedDocuments.length})
          </h3>
          <div className="space-y-3">
            {uploadedDocuments.map((doc, index) => (
              <DocumentValidation
                key={doc.document.id || index}
                document={doc.document}
                ocr={doc.ocr}
                validation={doc.validation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
