'use client'

// ============================================
// FLASHJURIS - PAGE DE CAPTURE MOBILE-FIRST
// Route: /scan/[id]
// Prix: 149€ unique pour le client
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
  Lock
} from 'lucide-react'

interface LawyerInfo {
  id: string
  name: string
  firm: string | null
  city: string | null
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  file: File
  preview?: string
}

export default function ScanCapturePage() {
  const params = useParams()
  const router = useRouter()
  const lawyerId = params?.id as string
  
  // États
  const [lawyer, setLawyer] = useState<LawyerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Formulaire
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [caseType, setCaseType] = useState('')
  const [caseDescription, setCaseDescription] = useState('')
  
  // Documents
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  
  // Soumission
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [caseReference, setCaseReference] = useState('')
  
  // Prix
  const PRICE_EUROS = 149
  
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
  
  // Format taille fichier
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
          clientName,
          clientEmail,
          clientPhone,
          caseType,
          caseDescription,
        }),
      })
      
      const caseData = await caseRes.json()
      
      if (!caseData.success) {
        throw new Error(caseData.error || 'Erreur lors de la création')
      }
      
      const caseId = caseData.case.id
      setCaseReference(caseData.case.reference)
      
      // 2. Préparer le FormData avec les fichiers
      const formData = new FormData()
      formData.append('caseId', caseId)
      
      files.forEach(f => {
        formData.append('files', f.file)
      })
      
      // 3. Uploader les fichiers (déclenche l'envoi email)
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
          <Button onClick={() => router.push('/')} variant="outline">
            Retour à l'accueil
          </Button>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Documents envoyés !
          </h1>
          <p className="text-gray-600 mb-4">
            Votre dossier a été transmis à <strong>{lawyer?.name}</strong>
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">Référence du dossier</p>
            <p className="font-mono font-bold text-lg text-gray-900">{caseReference}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Paiement de {PRICE_EUROS}€ confirmé</strong>
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Les documents seront supprimés automatiquement dans 7 jours.
          </p>
        </div>
      </div>
    )
  }
  
  // Formulaire principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{lawyer?.name}</p>
            {lawyer?.firm && <p className="text-xs text-gray-500">{lawyer.firm}</p>}
          </div>
        </div>
      </header>
      
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Titre */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Envoyez vos documents
          </h1>
          <p className="text-gray-600 text-sm">
            à {lawyer?.name}
          </p>
        </div>
        
        {/* Prix */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 mb-6 text-center text-white">
          <p className="text-sm opacity-90">Service unique</p>
          <p className="text-3xl font-bold">{PRICE_EUROS}€</p>
          <p className="text-xs opacity-75 mt-1">Documents supprimés après 7 jours</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Identité */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Vos informations</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm text-gray-600">Nom complet *</Label>
                <Input
                  id="name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="mt-1.5 h-12 rounded-xl"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm text-gray-600">Email *</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="jean@email.com"
                    className="h-12 rounded-xl pl-11"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-sm text-gray-600">Téléphone</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="h-12 rounded-xl pl-11"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Section: Type d'affaire */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Type d'affaire</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['Divorce', 'Succession', 'Litige', 'Immobilier', 'Travail', 'Autre'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCaseType(type)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    caseType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <Textarea
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              placeholder="Décrivez brièvement votre situation..."
              className="min-h-[80px] rounded-xl resize-none"
            />
          </div>
          
          {/* Section: Documents */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Vos documents *</h2>
            </div>
            
            {/* Zone d'upload */}
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
            
            {/* Liste des fichiers */}
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
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* RGPD */}
          <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">Protection de vos données</p>
              <p>Vos documents sont chiffrés et supprimés automatiquement après 7 jours.</p>
            </div>
          </div>
          
          {/* Paiement */}
          <div className="bg-gray-900 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Total à payer</span>
              </div>
              <span className="text-2xl font-bold">{PRICE_EUROS}€</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Lock className="w-4 h-4" />
              Paiement sécurisé
            </div>
          </div>
          
          {/* Bouton de soumission */}
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
                Envoyer mes documents ({PRICE_EUROS}€)
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
