'use client'

import { useState } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { SynthesePanel } from './SynthesePanel'
import { DocumentViewer } from './DocumentViewer'

interface SplitViewProps {
  dossier: any
  analyse: any
  sources: any[]
  documents: any[]
}

/**
 * Composant SplitView
 * Split-view horizontal avec synthèse IA à gauche et documents à droite
 *
 * Features:
 * - Panneaux résizables (40% / 60% par défaut)
 * - Click sur donnée → affiche le document source
 * - Highlight zone dans le document
 */
export function SplitView({ dossier, analyse, sources, documents }: SplitViewProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    documents.length > 0 ? documents[0].id : null
  )
  const [highlightZone, setHighlightZone] = useState<any>(null)

  const selectedDocument = documents.find(d => d.id === selectedDocumentId)

  /**
   * Handler quand l'utilisateur clique sur une donnée dans la synthèse
   * @param documentId - ID du document source
   * @param zone - Zone à surligner dans le document (optionnel)
   */
  const handleDataClick = (documentId: string, zone?: any) => {
    setSelectedDocumentId(documentId)
    setHighlightZone(zone || null)
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Panneau gauche: Synthèse IA */}
      <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
        <div className="h-full overflow-y-auto bg-white">
          <SynthesePanel
            dossier={dossier}
            analyse={analyse}
            sources={sources}
            onDataClick={handleDataClick}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Panneau droit: Documents */}
      <ResizablePanel defaultSize={60} minSize={40}>
        <div className="h-full bg-gray-100">
          <DocumentViewer
            document={selectedDocument}
            documents={documents}
            highlightZone={highlightZone}
            onDocumentChange={(docId) => {
              setSelectedDocumentId(docId)
              setHighlightZone(null)
            }}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
