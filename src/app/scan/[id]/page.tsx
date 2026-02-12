'use client'

// ============================================
// FLASHJURIS - PAGE DE CAPTURE MULTI-JURIDICTION
// France, Belgique, Suisse, Luxembourg
// Prix adapté selon le pays
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  Camera, 
  FileText, 
  Check, 
  Loader2, 
  AlertCircle,
  Shield,
  Phone,
  Mail,
  User,
  ArrowRight,
  Trash2,
  CreditCard,
  Lock,
  MapPin,
  ChevronDown
} from 'lucide-react'
import { 
  COUNTRY_CONFIGS, 
  COUNTRY_OPTIONS, 
  type CountryCode,
  type CaseTypeConfig 
} from '@/lib/countries'

interface LawyerInfo {
  id: string
  name: string
  firm: string | null
  city: string | null
  country: string
}

export default function ScanCapturePage() {
  const params = useParams()
  const router = useRouter()
  const lawyerId = params?.id as string
  
  // États
  const [lawyer, setLawyer] = useState<LawyerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Localisation
  const [country, setCountry] = useState<CountryCode>('FR')
  const [showCountrySelect, setShowCountrySelect] = useState(false)
  
  // Formulaire
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientPostalCode, setClientPostalCode] = useState('')
  const [clientCity, setClientCity] = useState('')
  const [caseType, setCaseType] = useState('')
  const [caseSubType, setCaseSubType] = useState('')
  const [caseDescription, setCaseDescription] = useState('')
  
  // Documents
  const [files, setFiles] = useState<Array<{
    id: string
    name: string
    size: number
    type: string
    file: File
    preview?: string
  }>>([])
  const [dragActive, setDragActive] = useState(false)
  
  // Soumission
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [caseReference, setCaseReference] = useState('')
  
  // Configuration du pays
  const countryConfig = COUNTRY_CONFIGS[country]
  
  // Charger les infos de l'avocat
  useEffect(() => {
    const fetchLawyer = async () => {
      try {
        const res = await fetch(`/api/lawyers/${lawyerId}`)
        const data = await res.json()
        
        if (!res.ok || !data.success) {
          setError('Ce QR code n\'est pas valide ou n\'existe plus.')
        } else {
          setLawyer(data.lawyer)
          // Utiliser le pays de l'avocat par défaut
          if (data.lawyer.country) {
            setCountry(data.lawyer.country as CountryCode)
          }
        }
      } catch {
        setError('Impossible de charger les informations.')
      } finally {
        setLoading(false)
      }
    }
    
    if (lawyerId) {
      fetchLawyer()
    }
  }, [lawyerId])
  
  // Détecter le pays via l'email saisi
  useEffect(() => {
    if (clientEmail) {
      const domain = clientEmail.split('@')[1]?.toLowerCase()
      if (domain?.endsWith('.be')) setCountry('BE')
      else if (domain?.endsWith('.ch')) setCountry('CH')
      else if (domain?.endsWith('.lu')) setCountry('LU')
      else if (domain?.endsWith('.fr')) setCountry('FR')
    }
  }, [clientEmail])
  
  // Gestion des fichiers
  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    
    const fileArray = Array.from(newFiles).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    
    setFiles(prev => [...prev, ...fileArray])
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])
  
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clientName || !clientEmail || files.length === 0) {
      return
    }
    
    setSubmitting(true)
    
    try {
      // 1. Créer le dossier
      const caseRes = await fetch('/api/scan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyerId,
          country,
          clientName,
          clientEmail,
          clientPhone,
          clientPostalCode,
          clientCity,
          caseType,
          caseSubType,
          caseDescription,
        }),
      })
      
      const caseData = await caseRes.json()
      
      if (!caseData.success) {
        throw new Error(caseData.error || 'Erreur lors de la création')
      }
      
      const caseId = caseData.case.id
      setCaseReference(caseData.case.reference)
      
      // 2. Uploader les fichiers
      const formData = new FormData()
      formData.append('caseId', caseId)
      files.forEach(f => formData.append('files', f.file))
      
      const uploadRes = await fetch('/api/scan/upload', {
        method: 'POST',
        body: formData,
      })
      
      const uploadData = await uploadRes.json()
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Erreur lors de l\'upload')
      }
      
      setSubmitted(true)
      
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }
  
  // Types d'affaires pour le pays sélectionné
  const caseTypes = countryConfig?.caseTypes || []
  const selectedCaseType = caseTypes.find(t => t.id === caseType)
  const subTypes = selectedCaseType?.subTypes || []
  
  // États de l'interface
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }
  
  if (error && !lawyer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">QR Code invalide</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/')} variant="outline">Retour à l'accueil</Button>
        </div>
      </div>
    )
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Documents envoyés !</h1>
          <p className="text-gray-600 mb-4">Votre dossier a été transmis à <strong>{lawyer?.name}</strong></p>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">Référence du dossier</p>
            <p className="font-mono font-bold text-lg text-gray-900">{caseReference}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="text-blue-800 text-sm"><strong>Paiement de {countryConfig.priceDisplay} confirmé</strong></p>
            <p className="text-blue-600 text-xs">({countryConfig.name})</p>
          </div>
          <p className="text-sm text-gray-500">Les documents seront supprimés automatiquement dans 7 jours.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{lawyer?.name}</p>
            {lawyer?.firm && <p className="text-xs text-gray-500">{lawyer.firm}</p>}
          </div>
        </div>
      </header>
      
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Titre */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Envoyez vos documents</h1>
          <p className="text-gray-600 text-sm">à {lawyer?.name}</p>
        </div>
        
        {/* Sélecteur de pays */}
        <div className="mb-4">
          <button
            onClick={() => setShowCountrySelect(!showCountrySelect)}
            className="w-full bg-white rounded-xl border p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="text-xs text-gray-500">Votre pays de résidence</p>
                <p className="font-medium text-gray-900">
                  {COUNTRY_OPTIONS.find(c => c.code === country)?.flag} {countryConfig.name}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCountrySelect ? 'rotate-180' : ''}`} />
          </button>
          
          {showCountrySelect && (
            <div className="mt-2 bg-white rounded-xl border overflow-hidden shadow-lg">
              {COUNTRY_OPTIONS.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCountry(c.code as CountryCode)
                    setShowCountrySelect(false)
                    setCaseType('')
                    setCaseSubType('')
                  }}
                  className={`w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 ${
                    country === c.code ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-gray-500">{COUNTRY_CONFIGS[c.code as CountryCode].priceDisplay}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Prix */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 mb-6 text-center text-white">
          <p className="text-sm opacity-90">Service unique • {countryConfig.name}</p>
          <p className="text-3xl font-bold">{countryConfig.priceDisplay}</p>
          <p className="text-xs opacity-75 mt-1">Documents supprimés après 7 jours</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Identité */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Vos informations</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Nom complet *</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Votre nom complet"
                  className="mt-1.5 h-12 rounded-xl"
                  required
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Email *</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="h-12 rounded-xl pl-11"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Téléphone ({countryConfig.phonePrefix})</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder={`${countryConfig.phonePrefix} 6 12 34 56 78`}
                    className="h-12 rounded-xl pl-11"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-600">Code postal</Label>
                  <Input
                    value={clientPostalCode}
                    onChange={(e) => setClientPostalCode(e.target.value)}
                    placeholder="75001"
                    className="mt-1.5 h-12 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Ville</Label>
                  <Input
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    placeholder="Paris"
                    className="mt-1.5 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Type d'affaire */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Type d'affaire</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {caseTypes.map((type: CaseTypeConfig) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setCaseType(type.id)
                    setCaseSubType('')
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    caseType === type.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
            
            {/* Sous-types */}
            {subTypes.length > 0 && (
              <div className="mb-4">
                <Label className="text-sm text-gray-600 mb-2 block">Précision</Label>
                <div className="flex flex-wrap gap-2">
                  {subTypes.map((sub: string) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setCaseSubType(sub)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        caseSubType === sub
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <Textarea
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              placeholder="Décrivez brièvement votre situation..."
              className="min-h-[80px] rounded-xl resize-none"
            />
          </div>
          
          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Vos documents *</h2>
            </div>
            
            {/* Types de documents suggérés */}
            <div className="mb-4 flex flex-wrap gap-2">
              {countryConfig.documentTypes.slice(0, 4).map((doc) => (
                <span key={doc} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {doc}
                </span>
              ))}
            </div>
            
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => handleFiles(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              
              <p className="font-medium text-gray-700 mb-1">Appuyez pour ajouter des photos</p>
              <p className="text-sm text-gray-500">ou glissez vos fichiers ici</p>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {file.preview ? (
                      <img src={file.preview} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(file.id)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* RGPD */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Protection des données</p>
                <p className="text-xs">{countryConfig.gdprLaw}</p>
                <ul className="mt-2 text-xs space-y-1">
                  {countryConfig.legalMentions.slice(0, 2).map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Paiement */}
          <div className="bg-gray-900 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Total à payer</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{countryConfig.priceDisplay}</span>
                <p className="text-xs text-gray-400">{countryConfig.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Lock className="w-4 h-4" />
              Paiement sécurisé • {countryConfig.currency}
            </div>
          </div>
          
          {/* Bouton */}
          <Button
            type="submit"
            disabled={!clientName || !clientEmail || files.length === 0 || submitting}
            className="w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                Envoyer mes documents ({countryConfig.priceDisplay})
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
