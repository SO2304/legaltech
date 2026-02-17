'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Loader2, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Scale, Upload, Shield, ExternalLink, Sparkles } from 'lucide-react'
import { DocumentType, Pays } from '@prisma/client'

type Step = 'info' | 'situation' | 'documents'

// Document links for "Zéro Recherche" UX feature
const DOCUMENT_LINKS: Record<string, { label: string; url: string }> = {
  CARTE_IDENTITE: { label: 'Préfecture', url: 'https://www.service-public.fr/particuliers/vosdroits/N149' },
  ACTE_MARIAGE: { label: 'Mairie', url: 'https://www.service-public.fr/particuliers/vosdroits/N121' },
  BULLETIN_SALAIRE: { label: 'Espace RH', url: 'https://www.service-public.fr/particuliers/vosdroits/R2459' },
  AVIS_IMPOSITION: { label: 'Impots.gouv', url: 'https://www.impots.gouv.fr/particulier' },
  RELEVE_BANCAIRE: { label: 'Banque en ligne', url: '#' },
  TITRE_PROPRIETE: { label: 'Cadastre', url: 'https://www.cadastre.gouv.fr' },
}

const DOCUMENT_TYPES = [
  { type: DocumentType.CARTE_IDENTITE, label: "Carte d'identité ou Passeport", exige: true },
  { type: DocumentType.ACTE_MARIAGE, label: 'Acte de mariage', exige: true },
  { type: DocumentType.BULLETIN_SALAIRE, label: 'Bulletins de salaire (3 derniers mois)', exige: false },
  { type: DocumentType.AVIS_IMPOSITION, label: "Avis d'imposition", exige: false },
  { type: DocumentType.RELEVE_BANCAIRE, label: 'Relevés bancaires (6 derniers mois)', exige: false },
  { type: DocumentType.TITRE_PROPRIETE, label: 'Titre de propriété', exige: false },
]

export default function IntakePage({ params }: { params: Promise<{ dossierId: string }> }) {
  use(params)
  const router = useRouter()
  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [avocatId, setAvocatId] = useState<string | null>(null)
  const [dossierId, setDossierId] = useState<string | null>(null)
  const [dossierRef, setDossierRef] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; status: 'uploading' | 'ok' | 'error' }>>({})

  const [info, setInfo] = useState({ prenom: '', nom: '', email: '', telephone: '' })
  const [situation, setSituation] = useState({
    pays: 'FRANCE',
    dateMariage: '',
    nombreEnfants: '0',
    typeProcedure: 'divorce_consentement_mutuel',
    regimeMatrimonial: 'communaute_legale',
    bienImmobilier: 'non',
    accordAmiable: 'oui',
  })

  const progress = step === 'info' ? 33 : step === 'situation' ? 66 : 100
  const canContinue = info.prenom && info.nom && info.email
  const requiredDone = DOCUMENT_TYPES.filter(d => d.exige).every(d => uploadedDocs[d.type]?.status === 'ok')

  // Fetch available avocat on mount
  useEffect(() => {
    const fetchAvocat = async () => {
      try {
        // Get first available avocat from API
        const res = await fetch('/api/client/dossier?action=getAvocat')
        const data = await res.json()
        if (data.avocatId) {
          setAvocatId(data.avocatId)
        }
      } catch (error) {
        console.error('Error fetching avocat:', error)
      }
    }
    fetchAvocat()
  }, [])

  const handleCreateDossier = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...info,
          pays: situation.pays as Pays,
          dateMariage: situation.dateMariage,
          nombreEnfants: parseInt(situation.nombreEnfants),
          typeProcedure: situation.typeProcedure,
          avocatId: avocatId,
        })
      })
      const data = await res.json()
      if (data.success) {
        setDossierId(data.dossier.id)
        setDossierRef(data.dossier.reference)
        setStep('documents')
      } else {
        alert(data.error || 'Erreur lors de la création du dossier')
      }
    } catch {
      alert('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (type: string, file: File) => {
    if (!dossierId) return
    setUploading(type)
    setUploadedDocs(prev => ({ ...prev, [type]: { name: file.name, status: 'uploading' } }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('dossierId', dossierId)
      fd.append('type', type)
      fd.append('pays', situation.pays)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      setUploadedDocs(prev => ({ ...prev, [type]: { name: file.name, status: data.success ? 'ok' : 'error' } }))
    } catch {
      setUploadedDocs(prev => ({ ...prev, [type]: { name: file.name, status: 'error' } }))
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="min-h-screen bg-pearl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pearl-300 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-gold" />
            </div>
            <span className="font-serif font-bold text-xl text-navy">Lexia</span>
          </div>
          {dossierRef && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-navy/20 text-navy">Réf: {dossierRef}</Badge>
              {/* Security countdown badge */}
              <div className="flex items-center gap-1.5 text-xs text-navy/50 bg-pearl px-3 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5" />
                <span>Purge dans 6 jours</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Progressive Stepper */}
        <div className="mb-10">
          <div className="flex justify-between text-xs font-medium mb-3">
            <span className={`${step === 'info' ? 'text-navy' : 'text-navy/40'}`}>1. Identité</span>
            <span className={`${step === 'situation' ? 'text-navy' : 'text-navy/40'}`}>2. Situation</span>
            <span className={`${step === 'documents' ? 'text-navy' : 'text-navy/40'}`}>3. Documents</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-pearl-300" />
          <div className="h-1.5 bg-gradient-to-r from-gold to-gold-400 rounded-full mt-[-6px] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Step 1: Personal Info */}
        {step === 'info' && (
          <Card className="border-pearl-300 shadow-paper">
            <CardHeader>
              <CardTitle className="font-serif text-navy">Vos informations personnelles</CardTitle>
              <CardDescription className="text-navy/60">Ces informations restent strictement confidentielles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-navy font-medium">Prénom *</Label>
                  <Input 
                    placeholder="Jean" 
                    value={info.prenom} 
                    onChange={e => setInfo({ ...info, prenom: e.target.value })}
                    className="border-pearl-300 focus:border-gold focus:ring-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-navy font-medium">Nom *</Label>
                  <Input 
                    placeholder="Dupont" 
                    value={info.nom} 
                    onChange={e => setInfo({ ...info, nom: e.target.value })}
                    className="border-pearl-300 focus:border-gold focus:ring-gold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-navy font-medium">Email *</Label>
                <Input 
                  type="email" 
                  placeholder="jean.dupont@email.com" 
                  value={info.email} 
                  onChange={e => setInfo({ ...info, email: e.target.value })}
                  className="border-pearl-300 focus:border-gold focus:ring-gold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-navy font-medium">Téléphone</Label>
                <Input 
                  type="tel" 
                  placeholder="+33 6 12 34 56 78" 
                  value={info.telephone} 
                  onChange={e => setInfo({ ...info, telephone: e.target.value })}
                  className="border-pearl-300 focus:border-gold focus:ring-gold"
                />
              </div>
              <Button 
                className="w-full bg-navy hover:bg-navy-600" 
                onClick={() => setStep('situation')} 
                disabled={!canContinue}
              >
                Continuer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Situation */}
        {step === 'situation' && (
          <Card className="border-pearl-300 shadow-paper">
            <CardHeader>
              <CardTitle className="font-serif text-navy">Votre situation conjugale</CardTitle>
              <CardDescription className="text-navy/60">Ces informations permettent d'adapter l'analyse juridique.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-navy font-medium">Pays de résidence</Label>
                <Select value={situation.pays} onValueChange={v => setSituation({ ...situation, pays: v })}>
                  <SelectTrigger className="border-pearl-300 focus:border-gold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRANCE">🇫🇷 France</SelectItem>
                    <SelectItem value="BELGIQUE">🇧🇪 Belgique</SelectItem>
                    <SelectItem value="SUISSE">🇨🇭 Suisse</SelectItem>
                    <SelectItem value="LUXEMBOURG">🇱🇺 Luxembourg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-navy font-medium">Type de procédure</Label>
                <Select value={situation.typeProcedure} onValueChange={v => setSituation({ ...situation, typeProcedure: v })}>
                  <SelectTrigger className="border-pearl-300 focus:border-gold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="divorce_consentement_mutuel">Consentement mutuel</SelectItem>
                    <SelectItem value="divorce_acceptation_rupture">Acceptation de la rupture</SelectItem>
                    <SelectItem value="divorce_faute">Divorce pour faute</SelectItem>
                    <SelectItem value="divorce_alteration_lien">Altération du lien conjugal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-navy font-medium">Régime matrimonial</Label>
                <Select value={situation.regimeMatrimonial} onValueChange={v => setSituation({ ...situation, regimeMatrimonial: v })}>
                  <SelectTrigger className="border-pearl-300 focus:border-gold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="communaute_legale">Communauté légale</SelectItem>
                    <SelectItem value="separation_biens">Séparation de biens</SelectItem>
                    <SelectItem value="communaute_universelle">Communauté universelle</SelectItem>
                    <SelectItem value="participation_acquets">Participation aux acquêts</SelectItem>
                    <SelectItem value="inconnu">Je ne sais pas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-navy font-medium">Date de mariage</Label>
                <Input 
                  type="date" 
                  value={situation.dateMariage} 
                  onChange={e => setSituation({ ...situation, dateMariage: e.target.value })}
                  className="border-pearl-300 focus:border-gold focus:ring-gold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-navy font-medium">Nombre d'enfants mineurs</Label>
                <Select value={situation.nombreEnfants} onValueChange={v => setSituation({ ...situation, nombreEnfants: v })}>
                  <SelectTrigger className="border-pearl-300 focus:border-gold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Aucun</SelectItem>
                    <SelectItem value="1">1 enfant</SelectItem>
                    <SelectItem value="2">2 enfants</SelectItem>
                    <SelectItem value="3">3 enfants</SelectItem>
                    <SelectItem value="4">4 ou plus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-navy font-medium">Bien immobilier commun ?</Label>
                <Select value={situation.bienImmobilier} onValueChange={v => setSituation({ ...situation, bienImmobilier: v })}>
                  <SelectTrigger className="border-pearl-300 focus:border-gold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui</SelectItem>
                    <SelectItem value="non">Non</SelectItem>
                    <SelectItem value="en_cours">En cours d'acquisition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-navy font-medium">Accord amiable possible ?</Label>
                <Select value={situation.accordAmiable} onValueChange={v => setSituation({ ...situation, accordAmiable: v })}>
                  <SelectTrigger className="border-pearl-300 focus:border-gold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui, nous sommes en accord</SelectItem>
                    <SelectItem value="partiel">Partiellement</SelectItem>
                    <SelectItem value="non">Non, situation conflictuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep('info')} className="border-navy/20 text-navy hover:bg-pearl">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                </Button>
                <Button className="flex-1 bg-navy hover:bg-navy-600" onClick={handleCreateDossier} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? 'Création...' : <>Continuer <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Documents */}
        {step === 'documents' && (
          <Card className="border-pearl-300 shadow-paper">
            <CardHeader>
              <CardTitle className="font-serif text-navy">Téléversez vos documents</CardTitle>
              <CardDescription className="text-navy/60">
                Les documents obligatoires sont notifiés. Formats acceptés : PDF, JPG, PNG (max 10 Mo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DOCUMENT_TYPES.map(doc => {
                const uploaded = uploadedDocs[doc.type]
                const isUploading = uploading === doc.type
                const docLink = DOCUMENT_LINKS[doc.type]
                
                return (
                  <div key={doc.type} className="border border-pearl-300 rounded-xl p-4 bg-white hover:shadow-paper transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="w-4 h-4 text-navy/40 flex-shrink-0" />
                        <span className="text-sm font-medium text-navy">{doc.label}</span>
                        {doc.exige && <Badge variant="secondary" className="bg-gold/10 text-gold text-xs">Requis</Badge>}
                      </div>
                      {uploaded?.status === 'ok' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      {uploaded?.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    </div>
                    
                    {/* Direct access button for "Zéro Recherche" */}
                    {docLink && !uploaded?.status && (
                      <a 
                        href={docLink.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-600 mb-3 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Récupérer sur {docLink.label} ↗
                      </a>
                    )}
                    
                    {isUploading ? (
                      // AI Scan Animation
                      <div className="relative overflow-hidden bg-navy/5 rounded-lg py-4">
                        <div className="absolute inset-0 scan-animation bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                        <div className="flex items-center justify-center gap-2 text-sm text-navy">
                          <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                          <span>Analyse IA en cours...</span>
                        </div>
                      </div>
                    ) : uploaded?.status === 'ok' ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="flex-1 truncate">{uploaded.name}</span>
                        <label className="cursor-pointer text-xs underline text-navy/50 flex-shrink-0 hover:text-navy">
                          Remplacer
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f) }} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 border-2 border-dashed border-pearl-300 rounded-lg p-4 cursor-pointer hover:border-gold hover:bg-pearl/30 transition-all group">
                        <Upload className="w-5 h-5 text-navy/40 group-hover:text-gold transition-colors" />
                        <span className="text-sm text-navy/60 group-hover:text-navy">
                          {uploaded?.status === 'error' ? '⚠️ Erreur — Cliquez pour réessayer' : 'Cliquez pour sélectionner'}
                        </span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f) }}
                          disabled={!!uploading} />
                      </label>
                    )}
                  </div>
                )
              })}

              <div className="pt-4 border-t border-pearl-200">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-navy/60">Documents obligatoires :</span>
                  <span className="font-semibold text-navy">
                    {DOCUMENT_TYPES.filter(d => d.exige && uploadedDocs[d.type]?.status === 'ok').length}
                    /{DOCUMENT_TYPES.filter(d => d.exige).length}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('situation')} className="border-navy/20 text-navy hover:bg-pearl">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                  </Button>
                  <Button
                    className="flex-1 bg-navy hover:bg-navy-600"
                    onClick={() => dossierId && router.push(`/payment?dossierId=${dossierId}`)}
                    disabled={!requiredDone || !!uploading}
                  >
                    {!requiredDone ? 'Ajoutez les documents requis' : <>Passer au paiement <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
