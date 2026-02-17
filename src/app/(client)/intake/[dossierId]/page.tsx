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
import { Loader2, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Scale, Upload } from 'lucide-react'
import { DocumentType, Pays } from '@prisma/client'

type Step = 'info' | 'situation' | 'documents'

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
          avocatId: 'demo-avocat',
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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-slate-800" />
            <span className="font-bold text-lg text-slate-800">Lexia</span>
          </div>
          {dossierRef && <Badge variant="outline" className="text-xs">Réf: {dossierRef}</Badge>}
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span className={step === 'info' ? 'font-semibold text-slate-800' : ''}>1. Identité</span>
            <span className={step === 'situation' ? 'font-semibold text-slate-800' : ''}>2. Situation</span>
            <span className={step === 'documents' ? 'font-semibold text-slate-800' : ''}>3. Documents</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {step === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>Vos informations personnelles</CardTitle>
              <CardDescription>Ces informations restent strictement confidentielles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Prénom *</Label>
                  <Input placeholder="Jean" value={info.prenom} onChange={e => setInfo({ ...info, prenom: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Nom *</Label>
                  <Input placeholder="Dupont" value={info.nom} onChange={e => setInfo({ ...info, nom: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" placeholder="jean.dupont@email.com" value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Téléphone</Label>
                <Input type="tel" placeholder="+33 6 12 34 56 78" value={info.telephone} onChange={e => setInfo({ ...info, telephone: e.target.value })} />
              </div>
              <Button className="w-full bg-slate-900 hover:bg-slate-700" onClick={() => setStep('situation')} disabled={!canContinue}>
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'situation' && (
          <Card>
            <CardHeader>
              <CardTitle>Votre situation conjugale</CardTitle>
              <CardDescription>Ces informations permettent d'adapter l'analyse juridique.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Pays de résidence</Label>
                <Select value={situation.pays} onValueChange={v => setSituation({ ...situation, pays: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRANCE">🇫🇷 France</SelectItem>
                    <SelectItem value="BELGIQUE">🇧🇪 Belgique</SelectItem>
                    <SelectItem value="SUISSE">🇨🇭 Suisse</SelectItem>
                    <SelectItem value="LUXEMBOURG">🇱🇺 Luxembourg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Type de procédure</Label>
                <Select value={situation.typeProcedure} onValueChange={v => setSituation({ ...situation, typeProcedure: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="divorce_consentement_mutuel">Consentement mutuel</SelectItem>
                    <SelectItem value="divorce_acceptation_rupture">Acceptation de la rupture</SelectItem>
                    <SelectItem value="divorce_faute">Divorce pour faute</SelectItem>
                    <SelectItem value="divorce_alteration_lien">Altération du lien conjugal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Régime matrimonial</Label>
                <Select value={situation.regimeMatrimonial} onValueChange={v => setSituation({ ...situation, regimeMatrimonial: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="communaute_legale">Communauté légale</SelectItem>
                    <SelectItem value="separation_biens">Séparation de biens</SelectItem>
                    <SelectItem value="communaute_universelle">Communauté universelle</SelectItem>
                    <SelectItem value="participation_acquets">Participation aux acquêts</SelectItem>
                    <SelectItem value="inconnu">Je ne sais pas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Date de mariage</Label>
                <Input type="date" value={situation.dateMariage} onChange={e => setSituation({ ...situation, dateMariage: e.target.value })} />
              </div>

              <div className="space-y-1">
                <Label>Nombre d'enfants mineurs</Label>
                <Select value={situation.nombreEnfants} onValueChange={v => setSituation({ ...situation, nombreEnfants: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Aucun</SelectItem>
                    <SelectItem value="1">1 enfant</SelectItem>
                    <SelectItem value="2">2 enfants</SelectItem>
                    <SelectItem value="3">3 enfants</SelectItem>
                    <SelectItem value="4">4 ou plus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Bien immobilier commun ?</Label>
                <Select value={situation.bienImmobilier} onValueChange={v => setSituation({ ...situation, bienImmobilier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui</SelectItem>
                    <SelectItem value="non">Non</SelectItem>
                    <SelectItem value="en_cours">En cours d'acquisition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Accord amiable possible ?</Label>
                <Select value={situation.accordAmiable} onValueChange={v => setSituation({ ...situation, accordAmiable: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui, nous sommes en accord</SelectItem>
                    <SelectItem value="partiel">Partiellement</SelectItem>
                    <SelectItem value="non">Non, situation conflictuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep('info')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                </Button>
                <Button className="flex-1 bg-slate-900 hover:bg-slate-700" onClick={handleCreateDossier} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? 'Création...' : <>Continuer <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'documents' && (
          <Card>
            <CardHeader>
              <CardTitle>Téléversez vos documents</CardTitle>
              <CardDescription>
                Les documents <Badge variant="destructive" className="text-xs mx-1">Requis</Badge> sont obligatoires. PDF, JPG ou PNG (max 10 Mo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DOCUMENT_TYPES.map(doc => {
                const uploaded = uploadedDocs[doc.type]
                const isUploading = uploading === doc.type
                return (
                  <div key={doc.type} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium">{doc.label}</span>
                        {doc.exige && <Badge variant="destructive" className="text-xs">Requis</Badge>}
                      </div>
                      {uploaded?.status === 'ok' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      {uploaded?.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    </div>
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...
                      </div>
                    ) : uploaded?.status === 'ok' ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
                        <CheckCircle className="w-4 h-4" />
                        <span className="flex-1 truncate">{uploaded.name}</span>
                        <label className="cursor-pointer text-xs underline text-slate-500 flex-shrink-0">
                          Remplacer
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f) }} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-lg p-3 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500">
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

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-4 text-sm text-slate-500">
                  <span>Documents requis :</span>
                  <span className="font-medium text-slate-800">
                    {DOCUMENT_TYPES.filter(d => d.exige && uploadedDocs[d.type]?.status === 'ok').length}
                    /{DOCUMENT_TYPES.filter(d => d.exige).length}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('situation')}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                  </Button>
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-700"
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
