'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Scale, LogOut, Search, FileText, CheckCircle, Eye } from 'lucide-react'

interface Dossier {
  id: string
  reference: string
  statut: string
  montantTTC: number
  stripePaid: boolean
  createdAt: string
  client: { email: string; nom: string; prenom: string; pays: string }
  documents: { id: string; type: string }[]
}

const STATUS: Record<string, { label: string; color: string }> = {
  BROUILLON:           { label: 'Brouillon',        color: 'bg-slate-100 text-slate-600' },
  EN_ATTENTE_PAIEMENT: { label: 'Attente paiement', color: 'bg-amber-100 text-amber-700' },
  PAYE:                { label: 'Payé',             color: 'bg-blue-100 text-blue-700' },
  EN_ANALYSE:          { label: 'En analyse',       color: 'bg-purple-100 text-purple-700' },
  ANALYSE_TERMINEE:    { label: 'Analyse terminée', color: 'bg-green-100 text-green-700' },
  VALIDE:              { label: 'Validé',           color: 'bg-emerald-100 text-emerald-700' },
  PURGE:               { label: 'Purgé',            color: 'bg-red-100 text-red-600' },
}

const PAYS: Record<string, string> = {
  FRANCE: '🇫🇷', BELGIQUE: '🇧🇪', SUISSE: '🇨🇭', LUXEMBOURG: '🇱🇺'
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [avocat, setAvocat] = useState<{ id: string; nom: string; prenom: string } | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('avocat')
    if (!stored) {
      router.push('/login-avocat')
      return
    }
    const a = JSON.parse(stored)
    setAvocat(a)
    fetch(`/api/avocat/dossiers?avocatId=${a.id}`)
      .then(r => r.json())
      .then(data => { if (data.dossiers) setDossiers(data.dossiers) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  const filtered = dossiers.filter(d => {
    const q = search.toLowerCase()
    const matchQ = !q ||
      d.reference.toLowerCase().includes(q) ||
      `${d.client.prenom} ${d.client.nom}`.toLowerCase().includes(q) ||
      d.client.email.toLowerCase().includes(q)
    return matchQ && (filter === 'ALL' || d.statut === filter)
  })

  const stats = {
    total: dossiers.length,
    payes: dossiers.filter(d => d.stripePaid).length,
    analyses: dossiers.filter(d => ['ANALYSE_TERMINEE', 'VALIDE'].includes(d.statut)).length,
    ca: dossiers.filter(d => d.stripePaid).reduce((s, d) => s + d.montantTTC, 0),
  }

  const handleLogout = () => {
    sessionStorage.removeItem('avocat')
    router.push('/login-avocat')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-slate-800" />
            <span className="font-bold text-lg text-slate-800">Lexia</span>
            <span className="text-slate-400 text-sm ml-2">Espace avocat</span>
          </div>
          <div className="flex items-center gap-3">
            {avocat && (
              <span className="text-sm text-slate-600">{avocat.prenom} {avocat.nom}</span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total dossiers', value: stats.total },
            { label: 'Payés', value: stats.payes },
            { label: 'Analyses terminées', value: stats.analyses },
            { label: "Chiffre d'affaires", value: `${stats.ca.toFixed(0)}€` },
          ].map((s, i) => (
            <Card key={i} className="border-slate-100">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Rechercher un dossier ou client..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'PAYE', 'EN_ANALYSE', 'ANALYSE_TERMINEE', 'VALIDE'].map(f => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                className={filter === f ? 'bg-slate-900' : ''}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'Tous' : STATUS[f]?.label ?? f}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-slate-100">
            <CardContent className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucun dossier trouvé</p>
              {dossiers.length === 0 && (
                <p className="text-sm text-slate-400 mt-2">
                  Les dossiers apparaîtront ici après paiement des clients.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => {
              const st = STATUS[d.statut] ?? { label: d.statut, color: 'bg-slate-100 text-slate-600' }
              return (
                <Card key={d.id} className="border-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-slate-800">{d.reference}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                            {st.label}
                          </span>
                          {d.stripePaid && (
                            <span className="text-xs text-green-600 font-medium">✓ {d.montantTTC}€ payé</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          {d.client.prenom} {d.client.nom}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {d.client.email} · {PAYS[d.client.pays] ?? ''} {d.client.pays}
                          · {d.documents.length} doc(s)
                          · {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-700 flex-shrink-0"
                        onClick={() => router.push(`/dashboard/${d.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Voir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
