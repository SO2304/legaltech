'use client'

import { useCallback, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
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
  Zap,
  Brain,
  Scale
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const dossierId = params.dossierId as string

  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [pays, setPays] = useState<string>('FRANCE')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/geolocation')
      .then(r => r.json())
      .then(data => {
        setPays(data.pays || 'FRANCE')
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

      setDocuments(prev => [...prev, {
        id: tempId,
        name: file.name,
        status: 'uploading',
        progress: 0
      }])

      const formData = new FormData()
      formData.append('file', file)
      formData.append('dossierId', dossierId)
      formData.append('pays', pays)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

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
        setDocuments(prev => prev.map(d =>
          d.id === tempId ? { ...d, status: 'error', progress: 0 } : d
        ))
      }
    }
  }, [dossierId, pays])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/pdf': ['.pdf']
    }
  })

  const allUploaded = documents.length > 0 && documents.every(d => d.status === 'success')

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-100">1</div>
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Dépôt de vos pièces</h1>
            <p className="text-slate-500">Uploadez les documents nécessaires à l'analyse juridique ({pays}).</p>
          </div>

          <div
            {...getRootProps()}
            className={`p-16 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-200 ${isDragActive ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'}`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
              <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-xl font-semibold text-slate-900 mb-2">{isDragActive ? 'Déposez vos fichiers' : 'Glissez-déposez vos documents'}</p>
            <p className="text-slate-500 text-sm">PDF, JPG, PNG par exemple · Jusqu'à 10 Mo par fichier</p>
          </div>

          <AnimatePresence>
            {documents.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10 space-y-4">
                {documents.map(doc => (
                  <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 truncate">{doc.name}</span>
                        {doc.status === 'success' && <div className="text-green-600 text-xs font-bold uppercase tracking-wider flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Validé</div>}
                      </div>
                      {doc.status === 'uploading' && <Progress value={doc.progress} className="h-1.5" />}
                      {doc.validation?.estExige && <p className="text-xs text-blue-600 font-medium mt-1.5 flex items-center gap-1"><Zap className="w-3 h-3" /> Réf. légale : {doc.validation.articleLoi}</p>}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium"><Shield className="w-4 h-4 text-green-600" /> Sécurité RGPD</div>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium"><Clock className="w-4 h-4 text-blue-600" /> Purge J+7</div>
            </div>
            <Button
              size="lg"
              disabled={!allUploaded}
              onClick={() => router.push(`/payment?dossierId=${dossierId}`)}
              className="w-full md:w-auto h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-xl shadow-blue-100 group"
            >
              Passer au paiement <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-lg"><Brain className="w-10 h-10 mb-4 opacity-80" /><h3 className="font-bold text-lg mb-2">Analyse Intelligente</h3><p className="text-blue-100 text-sm">Extraction automatique et vérification de conformité en temps réel.</p></div>
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm"><Scale className="w-10 h-10 mb-4 text-blue-600" /><h3 className="font-bold text-lg text-slate-900 mb-2">Confidentialité Stricte</h3><p className="text-slate-500 text-sm">Documents chiffrés et accessibles uniquement par votre avocat.</p></div>
        </div>
      </div>
    </div>
  )
}
