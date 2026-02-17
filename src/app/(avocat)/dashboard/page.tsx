'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Clock, CheckCircle, AlertCircle, Users, DollarSign, LogOut } from 'lucide-react'
import { DossierStatus } from '@prisma/client'

interface Dossier {
  id: string
  reference: string
  statut: DossierStatus
  montantTTC: number
  stripePaid: boolean
  createdAt: string
  client: {
    email: string
    nom: string
    prenom: string
    pays: string
  }
  documents: {
    id: string
    type: string
    nomOriginal: string
    estValide: boolean
  }[]
}

const statusLabels: Record<DossierStatus, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  EN_ATTENTE_PAIEMENT: { label: 'En attente paiement', color: 'bg-yellow-100 text-yellow-800' },
  PAYE: { label: 'Payé', color: 'bg-blue-100 text-blue-800' },
  EN_ANALYSE: { label: 'En analyse', color: 'bg-purple-100 text-purple-800' },
  ANALYSE_TERMINEE: { label: 'Analyse terminée', color: 'bg-green-100 text-green-800' },
  VALIDE: { label: 'Validé', color: 'bg-emerald-100 text-emerald-800' },
  PURGE: { label: 'Purgé', color: 'bg-red-100 text-red-800' }
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [avocat, setAvocat] = useState<{ nom: string; prenom: string; email: string } | null>(null)

  // For demo, use a mock avocat ID
  const demoAvocatId = 'demo-avocat'

  useEffect(() => {
    // Mock lawyer data for demo
    setAvocat({
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@cabinet.fr'
    })

    // Mock dossiers for demo
    const mockDossiers: Dossier[] = [
      {
        id: '1',
        reference: 'DIV-2024-001',
        statut: DossierStatus.ANALYSE_TERMINEE,
        montantTTC: 149,
        stripePaid: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        client: {
          email: 'marie.martin@email.fr',
          nom: 'Martin',
          prenom: 'Marie',
          pays: 'FRANCE'
        },
        documents: [
          { id: '1', type: 'CARTE_IDENTITE', nomOriginal: 'carte_id.jpg', estValide: true },
          { id: '2', type: 'ACTE_MARIAGE', nomOriginal: 'acte_mariage.pdf', estValide: true }
        ]
      },
      {
        id: '2',
        reference: 'DIV-2024-002',
        statut: DossierStatus.PAYE,
        montantTTC: 149,
        stripePaid: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        client: {
          email: 'paul.durand@email.fr',
          nom: 'Durand',
          prenom: 'Paul',
          pays: 'FRANCE'
        },
        documents: [
          { id: '3', type: 'CARTE_IDENTITE', nomOriginal: 'passport.pdf', estValide: true }
        ]
      },
      {
        id: '3',
        reference: 'DIV-2024-003',
        statut: DossierStatus.EN_ATTENTE_PAIEMENT,
        montantTTC: 149,
        stripePaid: false,
        createdAt: new Date().toISOString(),
        client: {
          email: 'sophie.leroy@email.fr',
          nom: 'Leroy',
          prenom: 'Sophie',
          pays: 'BELGIQUE'
        },
        documents: []
      }
    ]

    setDossiers(mockDossiers)
    setLoading(false)
  }, [])

  const stats = {
    total: dossiers.length,
    payes: dossiers.filter(d => d.stripePaid).length,
    analysesTerminees: dossiers.filter(d => d.statut === DossierStatus.ANALYSE_TERMINEE).length,
    revenue: dossiers.filter(d => d.stripePaid).reduce((sum, d) => sum + d.montantTTC, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Tableau de bord</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{avocat?.prenom} {avocat?.nom}</p>
              <p className="text-sm text-muted-foreground">{avocat?.email}</p>
            </div>
            <Button variant="outline" size="icon">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total dossiers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.payes}</p>
                  <p className="text-sm text-muted-foreground">Payés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.analysesTerminees}</p>
                  <p className="text-sm text-muted-foreground">Analysés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.revenue}€</p>
                  <p className="text-sm text-muted-foreground">Revenus</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dossiers List */}
        <Card>
          <CardHeader>
            <CardTitle>Mes dossiers</CardTitle>
            <CardDescription>
              Liste de tous vos dossiers de divorce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dossiers.map((dossier) => (
                <div
                  key={dossier.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/${dossier.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium">{dossier.client.prenom} {dossier.client.nom}</p>
                      <p className="text-sm text-muted-foreground">{dossier.client.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge className={statusLabels[dossier.statut].color}>
                      {statusLabels[dossier.statut].label}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium">{dossier.montantTTC}€</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {dossiers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun dossier pour le moment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
