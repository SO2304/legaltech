<<<<<<< HEAD
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Scale,
    ArrowLeft,
    Download,
    FileText,
    AlertTriangle,
    ExternalLink,
    ChevronRight,
    ShieldCheck,
    Brain,
    Search,
    BookOpen
} from 'lucide-react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

export default function DossierDetail() {
    const params = useParams()
    const router = useRouter()
    const dossierId = params.id as string

    const [dossier, setDossier] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!dossierId) return

        fetch(`/api/dossiers/${dossierId}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) throw new Error(data.error)
                setDossier(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [dossierId])

    if (loading || !dossier) return null

    return (
        <div className="min-h-screen bg-slate-50/30">
            {/* Detail Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="container mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/dashboard')}
                            className="rounded-xl h-10 px-3 hover:bg-slate-100"
                        >
                            <ArrowLeft className="w-5 h-5 mr-1" />
                            Retour
                        </Button>
                        <div className="h-8 w-px bg-slate-100" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-slate-900">{dossier.reference}</h1>
                                <Badge className="bg-blue-600/10 text-blue-600 hover:bg-blue-600/10 border-none px-2 text-[10px] font-bold uppercase tracking-wider">
                                    {dossier.pays}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">
                                Client : {dossier.client.prenom} {dossier.client.nom.toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-xl font-bold text-slate-700 bg-white">
                            <Download className="w-4 h-4 mr-2" />
                            Exporter PDF
                        </Button>
                        <Button className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100">
                            Valider le dossier
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: AI Synthesis (Main) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden min-h-[700px]">
                            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                                        <Brain className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Synthèse d'Analyse IA</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 prose prose-slate max-w-none">
                                <ReactMarkdown>{dossier.analyseIA}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Source mapping & Documents */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-slate-900 border-slate-800 shadow-xl rounded-3xl overflow-hidden text-white">
                            <CardHeader className="p-6 border-b border-slate-800">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-green-400" />
                                    Conformité Légale
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Base de données</p>
                                    <p className="text-sm font-medium">Textes de loi ${dossier.pays} (Mise à jour Fév 2026)</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Algorithme</p>
                                    <p className="text-sm font-medium">RAG Strict (Claude 3.5 Sonnet)</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="p-6 border-b border-slate-50">
                                <CardTitle className="text-lg font-bold text-slate-900">Pièces Jointes</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {dossier.documents.map((doc: any) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 group-hover:bg-white rounded-xl flex items-center justify-center transition-colors">
                                                <FileText className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate pr-2">{doc.nomOriginal}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.type}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-amber-50 border-amber-100 shadow-sm rounded-3xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-amber-900 text-sm mb-1">Alerte IA</h4>
                                        <p className="text-amber-700 text-xs leading-relaxed">
                                            L'IA a détecté une pièce manquante (Attestation de non-revirement) exigée par l'Article 247-2.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    )
=======
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SplitView } from '@/components/avocat/SplitView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Download, Check } from 'lucide-react'

interface DossierDetailsPageProps {
  params: {
    id: string
  }
}

/**
 * Page Dashboard Avocat - Détails d'un dossier
 * Route: /dashboard/[id]
 *
 * Affiche un split-view:
 * - Gauche: Synthèse IA (tableaux patrimoine/revenus/charges)
 * - Droite: Documents avec viewer
 */
export default async function DossierDetailsPage({ params }: DossierDetailsPageProps) {
  const { id } = params

  // Récupérer le dossier complet
  const dossier = await prisma.dossier.findUnique({
    where: { id },
    include: {
      client: true,
      documents: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!dossier) {
    notFound()
  }

  // Parser l'analyse IA
  let analyseStructuree = null
  let sourcesLegales = []

  if (dossier.analyseIA) {
    try {
      analyseStructuree = JSON.parse(dossier.analyseIA)
    } catch (err) {
      console.error('Erreur parsing analyseIA:', err)
    }
  }

  if (dossier.sourcesLegales) {
    try {
      sourcesLegales = JSON.parse(dossier.sourcesLegales)
    } catch (err) {
      console.error('Erreur parsing sourcesLegales:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dossier {dossier.reference}
                </h1>
                <p className="text-gray-600">
                  {dossier.client.prenom} {dossier.client.nom} - {dossier.pays}
                </p>
              </div>

              {dossier.stripePaid && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Payé
                </Badge>
              )}

              {dossier.analyseIA && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Analysé
                </Badge>
              )}

              {dossier.statut === 'VALIDE' && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  Validé
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {dossier.analyseIA && dossier.statut !== 'VALIDE' && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    await fetch(`/api/dossier/${dossier.id}/valider`, {
                      method: 'POST'
                    })
                    window.location.reload()
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Valider le dossier
                </Button>
              )}

              {dossier.syntheseHTML && (
                <Button variant="outline" asChild>
                  <a href={`/api/dossier/${dossier.id}/export-pdf`} target="_blank">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="h-[calc(100vh-80px)]">
        {analyseStructuree ? (
          <SplitView
            dossier={dossier}
            analyse={analyseStructuree}
            sources={sourcesLegales}
            documents={dossier.documents}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Ce dossier n'a pas encore été analysé par l'IA
              </p>
              {dossier.stripePaid && (
                <Button
                  onClick={async () => {
                    await fetch('/api/analyse/dossier', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ dossierId: dossier.id })
                    })
                    window.location.reload()
                  }}
                >
                  🤖 Analyser maintenant
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98
}
