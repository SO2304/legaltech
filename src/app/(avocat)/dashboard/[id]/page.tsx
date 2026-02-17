'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Loader2, 
  ArrowLeft, 
  FileText, 
  User, 
  Brain, 
  ChevronLeft, 
  ChevronRight,
  Scale,
  Euro,
  Home,
  TrendingUp,
} from 'lucide-react'
import { DossierStatus, DocumentType } from '@prisma/client'

interface Document {
  id: string
  type: DocumentType
  nomOriginal: string
  mimeType: string
  taille: number
  texteExtrait: string | null
  exigeLegal: boolean
  estValide: boolean
  cheminStorage?: string
}

interface DataItem {
  id: string
  categorie: 'revenu' | 'charge' | 'patrimoine'
  label: string
  valeur: number
  documentId?: string
  articleLoi?: string
}

interface DossierDetail {
  id: string
  reference: string
  statut: DossierStatus
  pays: string
  typeProcedure: string
  dateMariage: string | null
  nombreEnfants: number
  montantTTC: number
  fraisGestion: number
  stripePaid: boolean
  stripePaidAt: string | null
  analyseIA: string | null
  syntheseHTML: string | null
  sourcesLegales: string | null
  createdAt: string
  client: {
    id: string
    email: string
    nom: string
    prenom: string
    telephone: string | null
    pays: string
  }
  documents: Document[]
}

const statusLabels: Record<DossierStatus, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  EN_ATTENTE_PAIEMENT: { label: 'En attente paiement', color: 'bg-yellow-100 text-yellow-800' },
  PAYE: { label: 'Payé', color: 'bg-blue-100 text-blue-800' },
  EN_ANALYSE: { label: 'En analyse', color: 'bg-purple-100 text-purple-800' },
  ANALYSE_TERMINEE: { label: 'Analyse terminée', color: 'bg-green-100 text-green-800' },
  VALIDE: { label: 'Validé', color: 'bg-emerald-100 text-emerald-800' },
  PURGE: { label: 'Purgé', color: 'bg-red-100 text-red-800' }
}

const documentTypeLabels: Record<DocumentType, string> = {
  CARTE_IDENTITE: 'Carte d\'identité',
  ACTE_MARIAGE: 'Acte de mariage',
  BULLETIN_SALAIRE: 'Bulletin de salaire',
  AVIS_IMPOSITION: 'Avis d\'imposition',
  RELEVE_BANCAIRE: 'Relevé bancaire',
  TITRE_PROPRIETE: 'Titre de propriété',
  AUTRE: 'Autre document'
}

// Mock financial data for demo
const mockDataItems: DataItem[] = [
  { id: '1', categorie: 'revenu', label: 'Salaire net mensuel', valeur: 2800, documentId: '3', articleLoi: 'Art. 270 Code Civil FR - Prestation compensatoire' },
  { id: '2', categorie: 'revenu', label: 'Prime annuelle', valeur: 5000, documentId: '3' },
  { id: '3', categorie: 'charge', label: 'Loyer mensuel', valeur: 1200, documentId: '3' },
  { id: '4', categorie: 'charge', label: 'Crédit voiture', valeur: 350, documentId: '3' },
  { id: '5', categorie: 'charge', label: 'Cantine enfants', valeur: 250, documentId: '3' },
  { id: '6', categorie: 'patrimoine', label: 'Appartement', valeur: 350000, documentId: '3', articleLoi: 'Art. 1387 Code Civil FR - Communauté réduite aux acquêts' },
  { id: '7', categorie: 'patrimoine', label: 'Voiture', valeur: 25000, documentId: '3' },
  { id: '8', categorie: 'patrimoine', label: 'Livret A', valeur: 15000, documentId: '3' },
]

export default function DossierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [dossier, setDossier] = useState<DossierDetail | null>(null)
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0)
  const [selectedDataItem, setSelectedDataItem] = useState<DataItem | null>(null)
  
  // Highlight zone for source-mapping (simulated)
  const highlightZone = selectedDataItem?.documentId 
    ? { x: 10, y: 20, width: 80, height: 15 } 
    : null

  useEffect(() => {
    // Mock dossier detail for demo
    const mockDossier: DossierDetail = {
      id: params.id as string,
      reference: 'DIV-2024-001',
      statut: DossierStatus.PAYE,
      pays: 'FRANCE',
      typeProcedure: 'divorce',
      dateMariage: '2015-06-15',
      nombreEnfants: 2,
      montantTTC: 149,
      fraisGestion: 30,
      stripePaid: true,
      stripePaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      analyseIA: null,
      syntheseHTML: null,
      sourcesLegales: null,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      client: {
        id: '1',
        email: 'marie.martin@email.fr',
        nom: 'Martin',
        prenom: 'Marie',
        telephone: '+33 6 12 34 56 78',
        pays: 'FRANCE'
      },
      documents: [
        {
          id: '1',
          type: DocumentType.CARTE_IDENTITE,
          nomOriginal: 'carte_identite.jpg',
          mimeType: 'image/jpeg',
          taille: 245000,
          texteExtrait: 'MARTIN Marie, née le 15/03/1985 à Paris',
          exigeLegal: true,
          estValide: true,
          cheminStorage: '/documents/carte_identite.jpg'
        },
        {
          id: '2',
          type: DocumentType.ACTE_MARIAGE,
          nomOriginal: 'acte_mariage.pdf',
          mimeType: 'application/pdf',
          taille: 125000,
          texteExtrait: 'Mariage célébré le 15/06/2015 à la mairie du 10ème arrondissement de Paris',
          exigeLegal: true,
          estValide: true,
          cheminStorage: '/documents/acte_mariage.pdf'
        },
        {
          id: '3',
          type: DocumentType.BULLETIN_SALAIRE,
          nomOriginal: 'bulletin_salaire_01.pdf',
          mimeType: 'application/pdf',
          taille: 98000,
          texteExtrait: 'MARTIN Marie - Salaire net: 2800€',
          exigeLegal: false,
          estValide: true,
          cheminStorage: '/documents/bulletin_salaire.pdf'
        }
      ]
    }

    setDossier(mockDossier)
    setLoading(false)
  }, [params.id])

  const handleDataClick = (item: DataItem) => {
    setSelectedDataItem(item)
    // Find document index if associated
    if (item.documentId && dossier) {
      const docIndex = dossier.documents.findIndex(d => d.id === item.documentId)
      if (docIndex >= 0) {
        setSelectedDocumentIndex(docIndex)
      }
    }
  }

  const handlePrevDocument = () => {
    if (dossier && selectedDocumentIndex > 0) {
      setSelectedDocumentIndex(selectedDocumentIndex - 1)
    }
  }

  const handleNextDocument = () => {
    if (dossier && selectedDocumentIndex < dossier.documents.length - 1) {
      setSelectedDocumentIndex(selectedDocumentIndex + 1)
    }
  }

  const handleLancerAnalyse = async () => {
    if (!dossier) return
    
    setAnalysing(true)
    setDossier({ ...dossier, statut: DossierStatus.EN_ANALYSE })

    setTimeout(() => {
      const analyseResult = `## Analyse du dossier de divorce

### Situation familiale
- Mariage célébré le 15/06/2015
- 2 enfants communs
- Durée du mariage: plus de 8 ans

### Points clés identifiés
1. **Prestation compensatoire**: Potentiellement due selon l'article 270 du Code civil
2. **Résidence des enfants**: À déterminer selon le mode de garde
3. **Liquidation du régime matrimonial**: Convention de participation aux acquêts

### Références légales
- Article 229 du Code civil (divorce par consentement mutuel)
- Article 270 du Code civil (prestation compensatoire)
- Article 373-2 du Code civil (droit de garde)`

      setDossier({
        ...dossier,
        statut: DossierStatus.ANALYSE_TERMINEE,
        analyseIA: analyseResult,
        syntheseHTML: '<div><h2>Analyse terminée</h2><p>Voir les détails ci-dessous...</p></div>'
      })
      setAnalysing(false)
    }, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Dossier introuvable</p>
      </div>
    )
  }

  const currentDocument = dossier.documents[selectedDocumentIndex]
  const totalRevenus = mockDataItems.filter(i => i.categorie === 'revenu').reduce((sum, i) => sum + i.valeur, 0)
  const totalCharges = mockDataItems.filter(i => i.categorie === 'charge').reduce((sum, i) => sum + i.valeur, 0)
  const totalPatrimoine = mockDataItems.filter(i => i.categorie === 'patrimoine').reduce((sum, i) => sum + i.valeur, 0)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        {/* HEADER - SPEC line 460 */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold">Dossier {dossier.reference}</h1>
                  <p className="text-sm text-muted-foreground">
                    {dossier.client.prenom} {dossier.client.nom}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={statusLabels[dossier.statut].color}>
                  {statusLabels[dossier.statut].label}
                </Badge>
                <Button variant="outline" size="sm">
                  Exporter
                </Button>
                {dossier.statut === DossierStatus.ANALYSE_TERMINEE && (
                  <Button variant="default" size="sm">
                    Valider
                  </Button>
                )}
                {dossier.statut === DossierStatus.PAYE && (
                  <Button onClick={handleLancerAnalyse} disabled={analysing}>
                    {analysing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Lancer l'analyse IA
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* SPLIT-VIEW - SPEC line 461-476 */}
        <main className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* LEFT PANEL (40%) - Data tables */}
            <div className="w-2/5 space-y-4">
              {/* Revenus */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Revenus
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <table className="w-full text-sm">
                    <tbody>
                      {mockDataItems.filter(i => i.categorie === 'revenu').map((item) => (
                        <tr 
                          key={item.id} 
                          className={`border-b cursor-pointer hover:bg-slate-50 ${selectedDataItem?.id === item.id ? 'bg-blue-50' : ''}`}
                          onClick={() => handleDataClick(item)}
                        >
                          <td className="py-2 flex items-center gap-2">
                            {item.articleLoi && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Scale className="w-3 h-3 text-amber-600" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">{item.articleLoi}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {item.label}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {item.valeur.toLocaleString('fr-FR')}€
                            {item.documentId && <span className="text-blue-500 ml-1">↗</span>}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-slate-100">
                        <td className="py-2">Total revenus</td>
                        <td className="py-2 text-right">{totalRevenus.toLocaleString('fr-FR')}€</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Charges */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Euro className="w-4 h-4 text-red-600" />
                    Charges
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <table className="w-full text-sm">
                    <tbody>
                      {mockDataItems.filter(i => i.categorie === 'charge').map((item) => (
                        <tr 
                          key={item.id} 
                          className={`border-b cursor-pointer hover:bg-slate-50 ${selectedDataItem?.id === item.id ? 'bg-blue-50' : ''}`}
                          onClick={() => handleDataClick(item)}
                        >
                          <td className="py-2 flex items-center gap-2">
                            {item.articleLoi && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Scale className="w-3 h-3 text-amber-600" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">{item.articleLoi}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {item.label}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {item.valeur.toLocaleString('fr-FR')}€
                            {item.documentId && <span className="text-blue-500 ml-1">↗</span>}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-slate-100">
                        <td className="py-2">Total charges</td>
                        <td className="py-2 text-right">{totalCharges.toLocaleString('fr-FR')}€</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Patrimoine */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Home className="w-4 h-4 text-blue-600" />
                    Patrimoine
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <table className="w-full text-sm">
                    <tbody>
                      {mockDataItems.filter(i => i.categorie === 'patrimoine').map((item) => (
                        <tr 
                          key={item.id} 
                          className={`border-b cursor-pointer hover:bg-slate-50 ${selectedDataItem?.id === item.id ? 'bg-blue-50' : ''}`}
                          onClick={() => handleDataClick(item)}
                        >
                          <td className="py-2 flex items-center gap-2">
                            {item.articleLoi && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Scale className="w-3 h-3 text-amber-600" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">{item.articleLoi}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {item.label}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {item.valeur.toLocaleString('fr-FR')}€
                            {item.documentId && <span className="text-blue-500 ml-1">↗</span>}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-slate-100">
                        <td className="py-2">Total patrimoine</td>
                        <td className="py-2 text-right">{totalPatrimoine.toLocaleString('fr-FR')}€</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Selected item legal info */}
              {selectedDataItem && selectedDataItem.articleLoi && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <Scale className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">{selectedDataItem.articleLoi}</p>
                        <p className="text-sm text-amber-700">
                          Source légale correspondante
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT PANEL (60%) - Document Viewer */}
            <div className="w-3/5">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Document: {currentDocument?.nomOriginal || 'Aucun'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handlePrevDocument}
                        disabled={selectedDocumentIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedDocumentIndex + 1} / {dossier.documents.length}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleNextDocument}
                        disabled={selectedDocumentIndex === dossier.documents.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Document Viewer Area */}
                  <div className="relative bg-slate-100 rounded-lg h-96 flex items-center justify-center overflow-hidden">
                    {/* Simulated document preview */}
                    {currentDocument ? (
                      <div className="text-center p-8">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                        <p className="text-lg font-medium">{currentDocument.nomOriginal}</p>
                        <p className="text-sm text-muted-foreground">
                          {documentTypeLabels[currentDocument.type]}
                        </p>
                        
                        {/* Highlight zone for source-mapping - SPEC line 478-485 */}
                        {highlightZone && selectedDataItem?.documentId === currentDocument.id && (
                          <div 
                            className="absolute border-2 border-blue-500 bg-blue-100/50 rounded"
                            style={{
                              left: `${highlightZone.x}%`,
                              top: `${highlightZone.y}%`,
                              width: `${highlightZone.width}%`,
                              height: `${highlightZone.height}%`
                            }}
                          >
                            <span className="absolute -top-6 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                              ↗ Source: {selectedDataItem.label}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Aucun document</p>
                    )}
                  </div>

                  {/* Document info */}
                  {currentDocument && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium">{documentTypeLabels[currentDocument.type]}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Taille</p>
                        <p className="font-medium">{(currentDocument.taille / 1000).toFixed(0)} KB</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Qualité</p>
                        <Badge variant={currentDocument.estValide ? 'default' : 'destructive'}>
                          {currentDocument.estValide ? 'Valide' : 'Invalide'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Exigence légale</p>
                        <Badge variant={currentDocument.exigeLegal ? 'outline' : 'secondary'}>
                          {currentDocument.exigeLegal ? 'Requis' : 'Optionnel'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Extracted text */}
                  {currentDocument?.texteExtrait && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Texte extrait:</p>
                      <div className="bg-slate-50 p-3 rounded text-sm font-mono">
                        {currentDocument.texteExtrait}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
