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
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter PDF
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
}
