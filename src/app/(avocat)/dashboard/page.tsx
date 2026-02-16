import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Scale,
  Plus,
  Mail,
  ArrowRight
} from 'lucide-react'
import { DossierStatus } from '@prisma/client'

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

  const getStatusBadge = (statut: DossierStatus, stripePaid: boolean) => {
    if (!stripePaid) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente paiement</Badge>
    }
    switch (statut) {
      case 'ANALYSE_TERMINEE':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Terminé</Badge>
      case 'PAYE':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Payé</Badge>
      case 'EN_ANALYSE':
        return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Analyse IA</Badge>
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-40">
        <div className="container h-full flex items-center justify-between px-6 mx-auto">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl text-slate-900">FlashJuris <span className="text-slate-400 font-medium">Avocat</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="w-5 h-5 text-slate-500" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
              Ma
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Dossiers totaux</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Dossiers payés</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.payes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Scale className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Analysés</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.analyses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">En attente</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.enAttente}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List Section */}
        <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">Dossiers Récents</CardTitle>
              <CardDescription className="text-slate-500 mt-1">Gérez vos dossiers de divorce multi-juridictions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-4 font-semibold text-slate-600">Référence</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Client</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Pays</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Statut</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
                    <th className="px-8 py-4 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dossiers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-900">{d.reference}</td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{d.client.prenom} {d.client.nom}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {d.client.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-medium text-slate-600">{d.pays}</td>
                      <td className="px-6 py-6">{getStatusBadge(d.statut, d.stripePaid)}</td>
                      <td className="px-6 py-6 text-slate-500 text-sm">
                        {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link href={`/dashboard/${d.id}`}>
                          <Button variant="ghost" className="rounded-xl hover:bg-blue-50 hover:text-blue-600 font-bold group">
                            Voir le dossier
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {dossiers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                        Aucun dossier pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
