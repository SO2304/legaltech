import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SplitView } from '@/components/avocat/SplitView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Download, Check, Scale } from 'lucide-react'

interface DossierDetailsPageProps {
  params: {
    id: string
  }
}

/**
 * Page Dashboard Avocat - Détails d'un dossier
 * Route: /dashboard/[id]
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
      // Fallback si c'est du markdown brut
      analyseStructuree = { resumeGeneral: dossier.analyseIA }
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
    <div className="min-h-screen bg-slate-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="rounded-xl h-10 px-3 hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Retour
              </Button>
            </Link>
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

            <div className="flex items-center gap-2">
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
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dossier.analyseIA && dossier.statut !== 'VALIDE' && (
              <Button className="rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100">
                <Check className="w-4 h-4 mr-2" />
                Valider le dossier
              </Button>
            )}
            <Button variant="outline" className="rounded-xl font-bold text-slate-700 bg-white">
              <Download className="w-4 h-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal via SplitView */}
      <div className="h-[calc(100vh-100px)]">
        {analyseStructuree ? (
          <SplitView
            dossier={dossier}
            analyse={analyseStructuree}
            sources={sourcesLegales}
            documents={dossier.documents}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-slate-100 max-w-md">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Scale className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Dossier en attente</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Ce dossier n'a pas encore été analysé par l'intelligence artificielle.
              </p>
              {dossier.stripePaid && (
                <Button className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white">
                  🤖 Lancer l'analyse AI
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
