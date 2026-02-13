'use client'

// ============================================
// ÉTAPE 6: UPLOAD DES DOCUMENTS
// ============================================

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDivorceForm } from '@/hooks/use-divorce-form'
import { ArrowLeft, Upload, FileText, X, Check, Loader2 } from 'lucide-react'
import { 
  DOCUMENT_TYPE_LABELS, 
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentType,
  type DocumentCategory 
} from '@/types/document'
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/config'

interface StepDocumentsProps {
  onNext: () => void
  onPrevious: () => void
}

interface FileWithUpload {
  file: File
  type: DocumentType
  uploaded: boolean
  uploading: boolean
  error: string | null
}

export function StepDocuments({ onNext, onPrevious }: StepDocumentsProps) {
  const { data } = useDivorceForm()
  const [files, setFiles] = useState<FileWithUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const handleFileSelect = useCallback((type: DocumentType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPTED_EXTENSIONS.join(',')
    input.multiple = false
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        alert(`Le fichier est trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
        return
      }
      
      // Vérifier si ce type existe déjà
      setFiles(prev => {
        const filtered = prev.filter(f => f.type !== type)
        return [...filtered, { file, type, uploaded: false, uploading: false, error: null }]
      })
    }
    
    input.click()
  }, [])
  
  const removeFile = (type: DocumentType) => {
    setFiles(prev => prev.filter(f => f.type !== type))
  }
  
  const uploadAllFiles = async () => {
    setIsUploading(true)
    
    const dossierId = data.dossierId
    if (!dossierId) {
      // Si pas de dossierId, on continue quand même (sera créé à la soumission)
      onNext()
      setIsUploading(false)
      return
    }
    
    for (const fileWithUpload of files) {
      if (fileWithUpload.uploaded) continue
      
      setFiles(prev => prev.map(f => 
        f.type === fileWithUpload.type 
          ? { ...f, uploading: true, error: null }
          : f
      ))
      
      try {
        const formData = new FormData()
        formData.append('file', fileWithUpload.file)
        formData.append('type', fileWithUpload.type)
        formData.append('dossierId', dossierId)
        formData.append('avocatId', data.avocatId || '')
        
        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'upload')
        }
        
        setFiles(prev => prev.map(f => 
          f.type === fileWithUpload.type 
            ? { ...f, uploaded: true, uploading: false }
            : f
        ))
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.type === fileWithUpload.type 
            ? { ...f, uploading: false, error: 'Erreur d\'upload' }
            : f
        ))
      }
    }
    
    setIsUploading(false)
    onNext()
  }
  
  const renderDocumentButton = (type: DocumentType) => {
    const existingFile = files.find(f => f.type === type)
    
    return (
      <div key={type} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
        <div className="flex items-center gap-3">
          {existingFile ? (
            existingFile.uploaded ? (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            ) : existingFile.uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <FileText className="w-8 h-8 text-blue-500" />
            )
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          <div>
            <p className="font-medium text-sm">{DOCUMENT_TYPE_LABELS[type]}</p>
            {existingFile && (
              <p className="text-xs text-gray-500">{existingFile.file.name}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {existingFile ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(type)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFileSelect(type)}
            >
              Ajouter
            </Button>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Documents justificatifs
        </h2>
        <p className="text-gray-600">
          Ajoutez les documents nécessaires à votre dossier. Formats acceptés: PDF, JPG, PNG.
        </p>
      </div>
      
      <div className="space-y-6">
        {(Object.entries(DOCUMENT_CATEGORIES) as [DocumentCategory, DocumentType[]][]).map(([category, types]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{DOCUMENT_CATEGORY_LABELS[category]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {types.map(type => renderDocumentButton(type))}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Tous vos documents seront chiffrés et automatiquement 
          supprimés après 7 jours conformément au RGPD.
        </p>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button 
          type="button" 
          onClick={uploadAllFiles}
          disabled={isUploading}
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Upload en cours...
            </>
          ) : (
            'Continuer'
          )}
        </Button>
      </div>
    </div>
  )
}
