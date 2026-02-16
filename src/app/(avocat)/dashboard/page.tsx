<<<<<<< HEAD
'use client'

import { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Scale,
    Users,
    Search,
    Filter,
    Plus,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    Mail,
    MoreVertical
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function LawyerDashboard() {
    const router = useRouter()
    const [dossiers, setDossiers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/dossiers')
            .then(r => r.json())
            .then(data => {
                if (data.error) throw new Error(data.error)
                setDossiers(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'ANALYSE_TERMINEE':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Terminé</Badge>
            case 'PAYE':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">En cours</Badge>
            case 'EN_ANALYSE':
                return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">Analyse IA</Badge>
            default:
                return <Badge variant="outline">{statut}</Badge>
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Sidebar / Topnav Mockup */}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Dossiers totaux</p>
                                    <p className="text-2xl font-bold text-slate-900">12</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Analyses terminées</p>
                                    <p className="text-2xl font-bold text-slate-900">8</p>
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
                                    <p className="text-2xl font-bold text-slate-900">4</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* List Section */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-slate-900">Dossiers Clients</CardTitle>
                            <CardDescription className="text-slate-500 mt-1">Gérez vos dossiers de divorce multi-juridictions</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un dossier..."
                                    className="pl-9 pr-4 h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-600 outline-none w-64"
                                />
                            </div>
                            <Button variant="outline" className="rounded-xl h-10 flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Filtres
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-[200px] py-4 pl-8">Référence</TableHead>
                                    <TableHead className="py-4">Client</TableHead>
                                    <TableHead className="py-4">Pays</TableHead>
                                    <TableHead className="py-4">Statut</TableHead>
                                    <TableHead className="py-4">Date</TableHead>
                                    <TableHead className="py-4 text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dossiers.map((d) => (
                                    <TableRow key={d.id} className="hover:bg-slate-50 group border-slate-100 transition-colors">
                                        <TableCell className="font-bold text-slate-900 py-6 pl-8">
                                            {d.reference}
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{d.client.prenom} {d.client.nom}</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {d.client.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 font-medium text-slate-600">
                                            {d.pays}
                                        </TableCell>
                                        <TableCell className="py-6">
                                            {getStatusBadge(d.statut)}
                                        </TableCell>
                                        <TableCell className="py-6 text-slate-500 text-sm">
                                            {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="py-6 text-right pr-8">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/${d.id}`)}
                                                className="rounded-xl hover:bg-blue-50 hover:text-blue-600 font-bold group"
                                            >
                                                Voir l'analyse
                                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
=======
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

                        {/* Badge erreur - NOTE: Aucun statut ERREUR dans l'enum DossierStatus */}
                        {/* Si besoin d'un statut d'erreur, ajouter à l'enum dans schema.prisma */}
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
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98
}
