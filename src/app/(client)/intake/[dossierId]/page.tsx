<<<<<<< HEAD
'use client'

import { useCallback, useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    ArrowRight,
    Shield,
    Clock,
    Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentType, Pays } from '@prisma/client'

interface UploadedDoc {
    id: string
    name: string
    status: 'uploading' | 'success' | 'error'
    progress: number
    ocr?: any
    validation?: any
}

export default function IntakePage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const dossierId = params.dossierId as string

    const [documents, setDocuments] = useState<UploadedDoc[]>([])
    const [pays, setPays] = useState<string>('FRANCE')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Détecter le pays via l'API de géolocalisation pour l'intake
        fetch('/api/geolocation')
            .then(r => r.json())
            .then(data => {
                setPays(data.pays)
                setLoading(false)
            })
            .catch(() => {
                setPays('FRANCE')
                setLoading(false)
            })
    }, [])

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        for (const file of acceptedFiles) {
            const tempId = Math.random().toString(36).substring(7)

            // Ajouter à la liste
            setDocuments(prev => [...prev, {
                id: tempId,
                name: file.name,
                status: 'uploading',
                progress: 0
            }])

            // Simulation progression (upload réel géré par fetch)
            let progress = 0
            const progressInterval = setInterval(() => {
                progress += 10
                if (progress > 90) clearInterval(progressInterval)
                setDocuments(prev => prev.map(d => d.id === tempId ? { ...d, progress } : d))
            }, 200)

            // Upload
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('dossierId', dossierId)
                formData.append('type', 'AUTRE') // Par défaut
                formData.append('pays', pays)

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                const result = await response.json()
                clearInterval(progressInterval)

                if (response.ok) {
                    setDocuments(prev => prev.map(d =>
                        d.id === tempId
                            ? { ...d, status: 'success', progress: 100, ocr: result.ocr, validation: result.validation }
                            : d
                    ))
                } else {
                    throw new Error(result.error)
                }
            } catch (error) {
                clearInterval(progressInterval)
                setDocuments(prev => prev.map(d =>
                    d.id === tempId
                        ? { ...d, status: 'error', progress: 0 }
                        : d
                ))
            }
        }
    }, [dossierId, pays])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png'],
            'application/pdf': ['.pdf']
        },
        maxSize: 10 * 1024 * 1024 // 10MB
    })

    const allUploaded = documents.length > 0 && documents.every(d => d.status === 'success')

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Progress Stepper */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                        <span className="font-semibold text-slate-900">Documents</span>
                    </div>
                    <div className="h-px w-12 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold">2</div>
                        <span className="font-semibold text-slate-400">Paiement</span>
                    </div>
                    <div className="h-px w-12 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold">3</div>
                        <span className="font-semibold text-slate-400">Analyse</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
                >
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dépôt de vos pièces</h1>
                        <p className="text-slate-500">
                            Veuillez uploader les documents nécessaires à l'analyse de votre dossier ({pays}).
                        </p>
                    </div>

                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`p-16 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-200 ${isDragActive
                                ? 'border-blue-600 bg-blue-50/50'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                            <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        </div>
                        <p className="text-xl font-semibold text-slate-900 mb-2">
                            {isDragActive ? 'Déposez vos fichiers' : 'Glissez-déposez vos documents'}
                        </p>
                        <p className="text-slate-500 text-sm">
                            PDF, JPG, PNG par exemple · Jusqu'à 10 Mo par fichier
                        </p>
                    </div>

                    {/* File List */}
                    <AnimatePresence>
                        {documents.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-10 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-900">Documents ({documents.length})</h2>
                                </div>

                                {documents.map(doc => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-6 h-6 text-slate-400" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-slate-900 truncate pr-4">{doc.name}</span>
                                                {doc.status === 'success' && (
                                                    <div className="flex items-center text-green-600 text-xs font-bold uppercase tracking-wider">
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Validé
                                                    </div>
                                                )}
                                                {doc.status === 'error' && (
                                                    <div className="flex items-center text-red-600 text-xs font-bold uppercase tracking-wider">
                                                        <AlertCircle className="w-4 h-4 mr-1" />
                                                        Erreur
                                                    </div>
                                                )}
                                            </div>

                                            {doc.status === 'uploading' && (
                                                <Progress value={doc.progress} className="h-1.5 bg-slate-200" />
                                            )}

                                            {doc.validation?.estExige && (
                                                <p className="text-xs text-blue-600 font-medium mt-1.5 flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    Réf. légale : {doc.validation.articleLoi}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CTA Section */}
                    <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <Shield className="w-4 h-4 text-green-600" />
                                Sécurité RGPD
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <Clock className="w-4 h-4 text-blue-600" />
                                Purge J+7
                            </div>
                        </div>

                        <Button
                            size="lg"
                            disabled={!allUploaded}
                            onClick={() => router.push(`/payment?dossierId=${dossierId}`)}
                            className="w-full md:w-auto h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-xl shadow-blue-100 transition-all transition-all group"
                        >
                            Passer au paiement
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </motion.div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-lg">
                        <Brain className="w-10 h-10 mb-4 opacity-80" />
                        <h3 className="font-bold text-lg mb-2">Analyse Intelligente</h3>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Claude 3.5 Sonnet extrait automatiquement les données de vos documents et vérifie leur conformité légale en temps réel.
                        </p>
                    </div>
                    <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                        <Scale className="w-10 h-10 mb-4 text-blue-600" />
                        <h3 className="font-bold text-lg text-slate-900 mb-2">Confidentialité Stricte</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Vos documents sont chiffrés et ne sont accessibles que par les algorithmes d'analyse et votre avocat destinataire.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
=======
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DocumentUploader } from '@/components/client/DocumentUploader'

interface IntakePageProps {
  params: {
    dossierId: string
  }
}

/**
 * Page Intake Client
 * Upload de documents pour un dossier de divorce
 */
export default async function IntakePage({ params }: IntakePageProps) {
  const { dossierId } = params

  // Récupérer le dossier
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      client: true,
      documents: true
    }
  })

  if (!dossier) {
    notFound()
  }

  // Si le dossier est déjà payé, rediriger vers la page de paiement
  if (dossier.stripePaid) {
    redirect(`/confirmation?dossierId=${dossierId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Étape 1/3 : Upload de vos documents
              </h1>
              <p className="text-gray-600 mt-2">
                Référence: <span className="font-mono">{dossier.reference}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Pays détecté</p>
              <p className="font-semibold text-gray-900">{dossier.pays}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Étape 1/3</span>
            <span className="text-sm text-gray-600">Documents</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Document Uploader */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <DocumentUploader dossierId={dossierId} pays={dossier.pays} />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>
                Uploadez tous les documents pertinents (acte de mariage, carte d'identité, bulletins de salaire, etc.)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>
                Notre système analyse automatiquement vos documents avec l'IA
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>
                Vérifiez la qualité et la validation de chaque document
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>
                Une fois tous vos documents uploadés, cliquez sur "Continuer vers le paiement"
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => window.history.back()}
          >
            ← Retour
          </button>

          <a
            href={`/payment?dossierId=${dossierId}`}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${
                dossier.documents.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
              }
            `}
          >
            Continuer vers le paiement →
          </a>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            🔒 Vos documents sont sécurisés et seront automatiquement supprimés 7 jours après validation
          </p>
          <p className="mt-1">
            Conformité RGPD
          </p>
        </div>
      </div>
    </div>
  )
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98
}
