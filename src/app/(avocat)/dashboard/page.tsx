import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

/**
 * Page Dashboard Avocat - Liste des dossiers
 * Route: /dashboard
 */
export default async function DashboardPage() {
  // Récupérer tous les dossiers
  const dossiers = await prisma.dossier.findMany({
    include: {
      client: true,
      documents: true,
      _count: {
        select: { documents: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Statistiques globales
  const stats = {
    total: dossiers.length,
    payes: dossiers.filter(d => d.stripePaid).length,
    analyses: dossiers.filter(d => d.analyseIA).length,
    enAttente: dossiers.filter(d => !d.stripePaid).length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Avocat</h1>
            <p className="text-gray-600 mt-1">Gestion des dossiers de divorce</p>
          </div>
          <Button variant="outline">
            Déconnexion
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total dossiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Payés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.payes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Analysés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.analyses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.enAttente}</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des dossiers */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Dossiers récents</h2>

          {dossiers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Aucun dossier pour le moment
              </CardContent>
            </Card>
          ) : (
            dossiers.map((dossier) => (
              <Card key={dossier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Référence et nom */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {dossier.reference}
                        </h3>
                        <span className="text-gray-600">
                          {dossier.client.prenom} {dossier.client.nom}
                        </span>
                      </div>

                      {/* Badges de statut */}
                      <div className="flex items-center gap-2 mb-3">
                        {/* Statut paiement */}
                        {dossier.stripePaid ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Payé
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            <Clock className="w-3 h-3 mr-1" />
                            En attente paiement
                          </Badge>
                        )}

                        {/* Statut analyse */}
                        {dossier.analyseIA ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Analysé
                          </Badge>
                        ) : dossier.stripePaid ? (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            Non analysé
                          </Badge>
                        ) : null}

                        {/* Statut validation */}
                        {dossier.statut === 'VALIDE' && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Validé
                          </Badge>
                        )}

                        {/* Badge erreur */}
                        {dossier.statut === 'ERREUR' && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Erreur
                          </Badge>
                        )}
                      </div>

                      {/* Informations supplémentaires */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {dossier._count.documents} documents
                        </span>
                        <span>Pays: {dossier.pays}</span>
                        <span>
                          Créé le {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Link href={`/dashboard/${dossier.id}`}>
                        <Button>
                          Voir le dossier
                        </Button>
                      </Link>

                      {dossier.stripePaid && !dossier.analyseIA && (
                        <Button
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={async () => {
                            // Déclencher l'analyse
                            await fetch('/api/analyse/dossier', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ dossierId: dossier.id })
                            })
                            window.location.reload()
                          }}
                        >
                          🤖 Analyser
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
