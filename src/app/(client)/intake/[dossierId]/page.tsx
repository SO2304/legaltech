'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { DocumentType, Pays } from '@prisma/client'

type Step = 'info' | 'documents' | 'review'

interface DossierData {
  id: string
  reference: string
  statut: string
  montantTTC: number
  fraisGestion: number
}

const DOCUMENT_TYPES = [
  { type: DocumentType.CARTE_IDENTITE, label: 'Carte d\'identité ou Passeport', exige: true },
  { type: DocumentType.ACTE_MARIAGE, label: 'Acte de mariage', exige: true },
  { type: DocumentType.BULLETIN_SALAIRE, label: 'Bulletins de salaire (3 derniers mois)', exige: false },
  { type: DocumentType.AVIS_IMPOSITION, label: 'Avis d\'imposition', exige: false },
  { type: DocumentType.RELEVE_BANCAIRE, label: 'Relevés bancaires (6 derniers mois)', exige: false },
]

export default function IntakePage({ params }: { params: Promise<{ dossierId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dossier, setDossier] = useState<DossierData | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; status: string }>>({})
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    pays: 'FRANCE' as string,
    dateMariage: '',
    nombreEnfants: '0',
    typeProcedure: 'divorce',
  })

  // Get lawyer ID from URL or use default for demo
  const avocatId = 'demo-avocat'

  useEffect(() => {
    // If dossierId starts with "demo-", it's a new intake
    if (resolvedParams.dossierId.startsWith('demo-')) {
      setDossier(null)
    }
  }, [resolvedParams.dossierId])

  const handleInfoSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pays: formData.pays as Pays,
          nombreEnfants: parseInt(formData.nombreEnfants),
          avocatId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setDossier(data.dossier)
        setStep('documents')
      } else {
        alert(data.error || 'Erreur lors de la création du dossier')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!dossier) return
    
    setUploading(true)
    setUploadedDocs(prev => ({ ...prev, [documentType]: { name: file.name, status: 'uploading' } }))
    
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('dossierId', dossier.id)
      formDataUpload.append('type', documentType)
      formDataUpload.append('pays', formData.pays)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })
      
      const data = await response.json()
      if (data.success) {
        setUploadedDocs(prev => ({ ...prev, [documentType]: { name: file.name, status: 'uploaded' } }))
      } else {
        setUploadedDocs(prev => ({ ...prev, [documentType]: { name: file.name, status: 'error' } }))
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadedDocs(prev => ({ ...prev, [documentType]: { name: file.name, status: 'error' } }))
    } finally {
      setUploading(false)
    }
  }

  const handleReview = async () => {
    router.push(`/payment?dossierId=${dossier?.id}`)
  }

  const progress = step === 'info' ? 33 : step === 'documents' ? 66 : 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">Divorce Platform</span>
          </div>
          {dossier && (
            <Badge variant="outline">
              Réf: {dossier.reference}
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Progress value={progress} className="mb-8" />
          
          {step === 'info' && (
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Veuillez fournir vos informations pour créer votre dossier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={e => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.dupont@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pays">Pays de résidence</Label>
                  <Select
                    value={formData.pays}
                    onValueChange={value => setFormData({ ...formData, pays: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRANCE">🇫🇷 France</SelectItem>
                      <SelectItem value="BELGIQUE">🇧🇫 Belgique</SelectItem>
                      <SelectItem value="SUISSE">🇨🇭 Suisse</SelectItem>
                      <SelectItem value="LUXEMBOURG">🇱🇺 Luxembourg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateMariage">Date de mariage</Label>
                  <Input
                    id="dateMariage"
                    type="date"
                    value={formData.dateMariage}
                    onChange={e => setFormData({ ...formData, dateMariage: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nombreEnfants">Nombre d'enfants</Label>
                  <Select
                    value={formData.nombreEnfants}
                    onValueChange={value => setFormData({ ...formData, nombreEnfants: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full mt-6" 
                  onClick={handleInfoSubmit}
                  disabled={loading || !formData.email || !formData.nom || !formData.prenom}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Continuer vers les documents
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'documents' && (
            <Card>
              <CardHeader>
                <CardTitle>Téléchargement des documents</CardTitle>
                <CardDescription>
                  Veuillez téléverser les documents demandés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {DOCUMENT_TYPES.map((doc) => (
                  <div key={doc.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{doc.label}</span>
                        {doc.exige && <Badge variant="destructive">Requis</Badge>}
                      </div>
                      {uploadedDocs[doc.type]?.status === 'uploaded' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {uploadedDocs[doc.type]?.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(doc.type, file)
                      }}
                      disabled={uploading}
                    />
                    {uploadedDocs[doc.type]?.name && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {uploadedDocs[doc.type].name}
                      </p>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('info')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button className="flex-1" onClick={handleReview} disabled={uploading}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Passer au paiement
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
