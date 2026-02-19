'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Loader2, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Scale, Upload, Shield, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react'
import { Pays } from '@prisma/client'
import { DOMAINS, getDomainById, DomainConfig, ChampSituation, DocumentConfig } from '@/lib/domains'

type Step = 'domaine' | 'info' | 'situation' | 'documents'

// Ordre des étapes
const STEP_ORDER: Step[] = ['domaine', 'info', 'situation', 'documents']

export default function IntakePage({ params }: { params: Promise<{ dossierId: string }> }) {
  const { dossierId } = use(params)
  const router = useRouter()
  
  // États
  const [step, setStep] = useState<Step>('domaine')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Données session
  const [avocatId, setAvocatId] = useState<string | null>(null)
  const [avocatNom, setAvocatNom] = useState<string>('')
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
  const [linkToken, setLinkToken] = useState<string>('')
  
  // Données formulaire
  const [dossierIdDb, setDossierIdDb] = useState<string | null>(null)
  const [dossierRef, setDossierRef] = useState<string | null>(null)
  const [datePurge, setDatePurge] = useState<Date | null>(null)
  const [zipSent, setZipSent] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; status: 'uploading' | 'ok' | 'error' }>>({})

  const [info, setInfo] = useState({ prenom: '', nom: '', email: '', telephone: '' })
  const [situation, setSituation] = useState<Record<string, string>>({})

  // Computed
  const domain = selectedDomainId ? getDomainById(selectedDomainId) : null
  
  // Guard de session - bloquer si pas d'accès
  useEffect(() => {
    const storedAvocatId = sessionStorage.getItem('avocatId')
    const storedAvocatNom = sessionStorage.getItem('avocatNom') || ''
    const storedDomaine = sessionStorage.getItem('domaine')
    const storedToken = sessionStorage.getItem('linkToken') || ''

    if (!storedAvocatId) {
      setError('Accès restreint')
      return
    }

    setAvocatId(storedAvocatId)
    setAvocatNom(storedAvocatNom)
    setLinkToken(storedToken)

    // Si domaine prédéfini, skip étape domaine
    if (storedDomaine) {
      setSelectedDomainId(storedDomaine)
      setStep('info')
    }
  }, [])

  // Déterminer les étapes visibles
  const visibleSteps = selectedDomainId 
    ? STEP_ORDER.filter(s => s !== 'domaine')
    : STEP_ORDER
  
  const currentStepIndex = visibleSteps.indexOf(step)
  const progress = ((currentStepIndex + 1) / visibleSteps.length) * 100

  // Validation
  const canContinueInfo = info.prenom && info.nom && info.email
  const canContinueSituation = domain?.champs.every(c => !c.required || situation[c.id]) || false
  const requiredDocs = domain?.documents.filter(d => d.exige) || []
  const requiredDone = requiredDocs.every(d => uploadedDocs[d.type]?.status === 'ok')

  // Handlers
  const goNext = () => {
    const currentIndex = visibleSteps.indexOf(step)
    if (currentIndex < visibleSteps.length - 1) {
      setStep(visibleSteps[currentIndex + 1])
    }
  }

  const goBack = () => {
    const currentIndex = visibleSteps.indexOf(step)
    if (currentIndex > 0) {
      setStep(visibleSteps[currentIndex - 1])
    }
  }

  const handleCreateDossier = async () => {
    if (!avocatId || !domain) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/client/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...info,
          pays: (situation.pays as Pays) || 'FRANCE',
          domaine: domain.id,
          situationJSON: JSON.stringify(situation),
          avocatId: avocatId,
          linkToken: linkToken,
          // Champs additionnels selon domaine
          dateMariage: situation.dateMariage,
          nombreEnfants: situation.nombreEnfants ? parseInt(situation.nombreEnfants) : 0,
          typeProcedure: situation.typeProcedure,
        })
      })
      const data = await res.json()
      if (data.success) {
        setDossierIdDb(data.dossier.id)
        setDossierRef(data.dossier.reference)
        if (data.dossier.datePurge) {
          setDatePurge(new Date(data.dossier.datePurge))
        }
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

  const handleUpload = async (docType: string, file: File) => {
    if (!dossierIdDb) return
    setUploading(docType)
    setUploadedDocs(prev => ({ ...prev, [docType]: { name: file.name, status: 'uploading' } }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('dossierId', dossierIdDb)
      fd.append('type', docType)
      fd.append('pays', situation.pays || 'FRANCE')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      setUploadedDocs(prev => ({ ...prev, [docType]: { name: file.name, status: data.success ? 'ok' : 'error' } }))
    } catch {
      setUploadedDocs(prev => ({ ...prev, [docType]: { name: file.name, status: 'error' } }))
    } finally {
      setUploading(null)
    }
  }

  // Écran d'erreur de session
  if (error) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center shadow-paper-xl">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="font-serif text-xl font-bold text-navy mb-2">
            Accès restreint
          </h1>
          <p className="text-navy/60 text-sm">
            Accessible uniquement via le lien de votre avocat.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pearl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pearl-300 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-gold" />
            </div>
            <span className="font-serif font-bold text-lg text-navy">Lexia</span>
            {avocatNom && (
              <span className="hidden md:inline text-navy/50 text-sm ml-2">
                · Dossier pour Maître {avocatNom}
              </span>
            )}
          </div>
          {dossierRef && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-navy/20 text-navy font-mono">
                {dossierRef}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-navy/50 bg-pearl px-3 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5" />
                <span>{datePurge ? `Suppression le ${new Date(datePurge).toLocaleDateString('fr-FR')}` : '—'}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Barre de progression */}
        {visibleSteps.length > 0 && (
          <div className="mb-10">
            <div className="flex justify-between text-xs font-medium mb-3">
              {visibleSteps.map((s, i) => (
                <span 
                  key={s} 
                  className={`${
                    i < currentStepIndex ? 'text-gold' : 
                    i === currentStepIndex ? 'text-navy' : 'text-navy/40'
                  }`}
                >
                  {i < currentStepIndex && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {i + 1}. {s === 'domaine' ? 'Domaine' : s === 'info' ? 'Identité' : s === 'situation' ? 'Situation' : 'Documents'}
                </span>
              ))}
            </div>
            <Progress value={progress} className="h-1.5 bg-pearl-300" />
          </div>
        )}

        {/* Step: Domaine */}
        {step === 'domaine' && (
          <Card className="border-pearl-300 shadow-paper">
            <CardHeader>
              <CardTitle className="font-serif text-navy">Votre domaine juridique</CardTitle>
              <CardDescription className="text-navy/60">
                La liste des documents s'adapte automatiquement à votre choix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOMAINS.map((d) => {
                  const isSelected = selectedDomainId === d.id
                  return (
                    <div
                      key={d.id}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-navy bg-white shadow-paper-lg'
                          : 'border-pearl-300 bg-white hover:border-navy/30'
                      }`}
                      onClick={() => setSelectedDomainId(d.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{d.icon}</span>
                        <div className="flex-1">
                          <p className="font-serif font-semibold text-navy text-sm">{d.label}</p>
                          <p className="text-xs text-navy/50">{d.description}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-gold" />}
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button 
                className="w-full bg-navy hover:bg-navy-600" 
                disabled={!selectedDomainId}
                onClick={goNext}
              >
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Info */}
        {step === 'info' && domain && (
          <Card className="border-pearl-300 shadow-paper">
            <CardHeader>
              {/* Récap domaine */}
              <div className="flex items-center gap-3 p-3 bg-pearl rounded-lg mb-4">
                <span className="text-2xl">{domain.icon}</span>
                <div>
                  <p className="font-serif font-semibold text-navy">{domain.label}</p>
                  <p className="text-xs text-navy/50">{domain.description}</p>
                </div>
              </div>
              <CardTitle className="font-serif text-navy">Vos informations</CardTitle>
              <CardDescription className="text-navy/60">
                Ces informations restent strictement confidentielles.
              </CardDescription>
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
                  placeholder="+33 6 00 00 00 00" 
                  value={info.telephone} 
                  onChange={e => setInfo({ ...info, telephone: e.target.value })}
                  className="border-pearl-300 focus:border-gold focus:ring-gold"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                {selectedDomainId && sessionStorage.getItem('domaine') === null && (
                  <Button variant="outline" onClick={goBack} className="border-navy/20 text-navy hover:bg-pearl">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                  </Button>
                )}
                <Button 
                  className="flex-1 bg-navy hover:bg-navy-600" 
                  disabled={!canContinueInfo}
                  onClick={goNext}
                >
                  Continuer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Situation */}
        {step === 'situation' && domain && (
          <Card className="border-pearl-300 shadow-paper">
            <CardHeader>
              <CardTitle className="font-serif text-navy">Votre situation</CardTitle>
              <CardDescription className="text-navy/60">
                Ces informations permettent d'adapter l'analyse juridique.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {domain.champs.map((champ: ChampSituation) => (
                <div key={champ.id} className="space-y-2">
                  <Label className="text-navy font-medium">
                    {champ.label}
                    {champ.required && <span className="text-gold ml-1">*</span>}
                  </Label>
                  
                  {champ.type === 'select' && champ.options && (
                    <Select 
                      value={situation[champ.id] || ''} 
                      onValueChange={v => setSituation({ ...situation, [champ.id]: v })}
                    >
                      <SelectTrigger className="border-pearl-300 focus:border-gold">
                        <SelectValue placeholder={champ.placeholder || 'Sélectionner...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {champ.options.map((opt: string) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {champ.type === 'text' && (
                    <Input 
                      type="text"
                      placeholder={champ.placeholder}
                      value={situation[champ.id] || ''}
                      onChange={e => setSituation({ ...situation, [champ.id]: e.target.value })}
                      className="border-pearl-300 focus:border-gold focus:ring-gold"
                    />
                  )}
                  
                  {champ.type === 'date' && (
                    <Input 
                      type="date"
                      value={situation[champ.id] || ''}
                      onChange={e => setSituation({ ...situation, [champ.id]: e.target.value })}
                      className="border-pearl-300 focus:border-gold focus:ring-gold"
                    />
                  )}
                  
                  {champ.type === 'number' && (
                    <Input 
                      type="number"
                      min={0}
                      placeholder={champ.placeholder}
                      value={situation[champ.id] || ''}
                      onChange={e => setSituation({ ...situation, [champ.id]: e.target.value })}
                      className="border-pearl-300 focus:border-gold focus:ring-gold"
                    />
                  )}
                </div>
              ))}

              {/* Bannière RGPD */}
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm">
                <Shield className="w-4 h-4" />
                <span>Vos données sont chiffrées et supprimées automatiquement après 7 jours.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={goBack} className="border-navy/20 text-navy hover:bg-pearl">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                </Button>
                <Button 
                  className="flex-1 bg-navy hover:bg-navy-600" 
                  disabled={!canContinueSituation || loading}
                  onClick={handleCreateDossier}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? 'Création...' : <>Passer au paiement <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Documents */}
        {step === 'documents' && domain && (
          <Card className="border-pearl-300 shadow-paper">
            <CardHeader>
              {zipSent && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Dossier complet !</p>
                    <p className="text-xs text-green-600">Votre avocat a reçu tous vos documents par email.</p>
                  </div>
                </div>
              )}
              <CardTitle className="font-serif text-navy">Vos documents</CardTitle>
              <CardDescription className="text-navy/60">
                {Object.keys(uploadedDocs).length} document(s) déposé(s) · {requiredDocs.filter(d => uploadedDocs[d.type]?.status === 'ok').length}/{requiredDocs.length} obligatoires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Section obligatoires */}
              <div>
                <p className="text-xs font-medium text-navy/50 uppercase mb-2">Obligatoires *</p>
                {requiredDocs.map((doc: DocumentConfig) => (
                  <DocCard 
                    key={doc.type}
                    doc={doc}
                    uploaded={uploadedDocs[doc.type]}
                    uploading={uploading === doc.type}
                    onUpload={(file) => handleUpload(doc.type, file)}
                  />
                ))}
              </div>

              {/* Section complémentaires */}
              {domain.documents.filter(d => !d.exige).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-navy/50 uppercase mb-2">Complémentaires</p>
                  {domain.documents.filter(d => !d.exige).map((doc: DocumentConfig) => (
                    <DocCard 
                      key={doc.type}
                      doc={doc}
                      uploaded={uploadedDocs[doc.type]}
                      uploading={uploading === doc.type}
                      onUpload={(file) => handleUpload(doc.type, file)}
                    />
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-pearl-200">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="border-navy/20 text-navy hover:bg-pearl">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                  </Button>
                  <Button
                    className="flex-1 bg-navy hover:bg-navy-600"
                    disabled={!requiredDone}
                    onClick={() => dossierIdDb && router.push(`/payment?dossierId=${dossierIdDb}`)}
                  >
                    {!requiredDone 
                      ? `Ajoutez ${requiredDocs.filter(d => !uploadedDocs[d.type]?.status === 'ok').length} document(s) obligatoire(s)`
                      : <>Passer au paiement <ArrowRight className="w-4 h-4 ml-2" /></>}
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

// Composant DocCard
function DocCard({ 
  doc, 
  uploaded, 
  uploading, 
  onUpload 
}: { 
  doc: DocumentConfig
  uploaded?: { name: string; status: 'uploading' | 'ok' | 'error' }
  uploading: boolean
  onUpload: (file: File) => void
}) {
  return (
    <div className={`border rounded-xl p-4 bg-white mb-3 transition-all ${
      uploaded?.status === 'ok' ? 'border-green-200' :
      uploaded?.status === 'error' ? 'border-red-200' :
      'border-pearl-300'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-navy/40" />
          ) : uploaded?.status === 'ok' ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : uploaded?.status === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <FileText className="w-4 h-4 text-navy/40" />
          )}
          <span className="text-sm font-medium text-navy">
            {doc.label}
            {doc.exige && <span className="text-gold ml-1">*</span>}
          </span>
        </div>
      </div>

      {doc.hint && !uploaded?.status && (
        <p className="text-xs text-navy/50 mb-2">{doc.hint}</p>
      )}

      {doc.link && !uploaded?.status && (
        <a 
          href={doc.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gold hover:underline mb-3"
        >
          {doc.link.label} <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {uploading ? (
        <div className="bg-pearl rounded-lg py-3 text-center text-sm text-navy/60">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Upload en cours...
        </div>
      ) : uploaded?.status === 'ok' ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 truncate flex-1">{uploaded.name}</span>
          <label className="text-xs underline cursor-pointer text-navy/50 hover:text-navy">
            Changer
            <input 
              type="file" 
              accept="image/*,.pdf" 
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
            />
          </label>
        </div>
      ) : (
        <label className="flex items-center gap-3 border-2 border-dashed border-pearl-300 rounded-lg p-4 cursor-pointer hover:border-gold hover:bg-pearl/30 transition-all">
          <Upload className="w-5 h-5 text-navy/40" />
          <span className="text-sm text-navy/60">Cliquez pour sélectionner</span>
          <input 
            type="file" 
            accept="image/*,.pdf" 
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
          />
        </label>
      )}
    </div>
  )
}
