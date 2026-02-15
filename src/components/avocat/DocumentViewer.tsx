'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react'
import Image from 'next/image'

interface DocumentViewerProps {
  document: any
  documents: any[]
  highlightZone?: any
  onDocumentChange: (documentId: string) => void
}

/**
 * Composant DocumentViewer
 * Affiche les documents avec viewer adapté selon le type
 *
 * Features:
 * - Viewer PDF (iframe)
 * - Viewer Image (Next Image)
 * - Navigation prev/next
 * - Sélecteur dropdown
 * - Highlight zone (optionnel)
 */
export function DocumentViewer({
  document,
  documents,
  highlightZone,
  onDocumentChange
}: DocumentViewerProps) {
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Sélectionnez une donnée dans la synthèse</p>
          <p className="text-sm">pour afficher le document source</p>
        </div>
      </div>
    )
  }

  const currentIndex = documents.findIndex(d => d.id === document.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < documents.length - 1

  const handlePrev = () => {
    if (hasPrev) {
      onDocumentChange(documents[currentIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onDocumentChange(documents[currentIndex + 1].id)
    }
  }

  const getBadgeColor = (qualite: string) => {
    switch (qualite) {
      case 'BONNE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'MOYENNE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FLOUE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ILLISIBLE':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return ''
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={!hasPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!hasNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Sélecteur de document */}
          <Select value={document.id} onValueChange={onDocumentChange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documents.map((doc, index) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {index + 1}. {doc.nomOriginal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Badges */}
          <Badge variant="outline" className="ml-2">
            {document.type}
          </Badge>

          {document.qualiteImage && (
            <Badge className={getBadgeColor(document.qualiteImage)}>
              {document.qualiteImage}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={document.cheminStorage} download target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </a>
          </Button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm">
          {document.mimeType === 'application/pdf' ? (
            // PDF Viewer
            <iframe
              src={document.cheminStorage}
              className="w-full h-[calc(100vh-200px)] rounded-lg"
              title={document.nomOriginal}
            />
          ) : document.mimeType?.startsWith('image/') ? (
            // Image Viewer
            <div className="relative p-8">
              <Image
                src={document.cheminStorage}
                alt={document.nomOriginal}
                width={1200}
                height={800}
                className="w-full h-auto rounded-lg"
                style={{
                  border: highlightZone ? '3px solid #3b82f6' : 'none',
                  boxShadow: highlightZone ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
                }}
              />

              {highlightZone && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📍 Zone surlignée dans le document
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Fallback
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Aperçu non disponible pour ce type de fichier</p>
              <p className="text-sm mt-2">Type: {document.mimeType}</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href={document.cheminStorage} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le fichier
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Infos OCR */}
      {document.donneesExtraites && (
        <div className="bg-white border-t p-4">
          <details className="cursor-pointer">
            <summary className="font-semibold text-gray-700">
              Données extraites par OCR
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(JSON.parse(document.donneesExtraites), null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
