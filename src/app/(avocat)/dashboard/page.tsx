'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Scale, LogOut, Search, FileText, CheckCircle, Eye, Link2, Plus, Trash2, Copy, RefreshCw } from 'lucide-react'
import { DOMAINS, DOMAIN_COLORS, getDomainById } from '@/lib/domains'

interface Dossier {
  id: string
  reference: string
  statut: string
  montantTTC: number
  stripePaid: boolean
  zipEnvoye: boolean
  createdAt: string
  domaine: string
  client: { email: string; nom: string; prenom: string; pays: string }
  documents: { id: string; type: string }[]
}

interface Lien {
  id: string
  token: string
  label: string | null
  domaine: string | null
  clics: number
  createdAt: string
  _count: { dossiers: number }
}

const STATUS: Record<string, { label: string; color: string }> = {
  BROUILLON:           { label: 'Brouillon',        color: 'bg-slate-100 text-slate-600' },
  EN_ATTENTE_PAIEMENT: { label: 'En attente',       color: 'bg-amber-100 text-amber-700' },
  PAYE:                { label: 'Payé',             color: 'bg-blue-100 text-blue-700' },
  EN_ANALYSE:          { label: 'En analyse',       color: 'bg-purple-100 text-purple-700' },
  ANALYSE_TERMINEE:    { label: 'Terminé',          color: 'bg-green-100 text-green-700' },
  VALIDE:              { label: 'Validé',           color: 'bg-emerald-100 text-emerald-700' },
  PURGE:               { label: 'Purgé',            color: 'bg-red-100 text-red-600' },
}

const PAYS: Record<string, string> = {
  FRANCE: '🇫🇷', BELGIQUE: '🇧🇪', SUISSE: '🇨🇭', LUXEMBOURG: '🇱🇺'
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dossiers' | 'liens'>('dossiers')
  
  // Dossiers state
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('ALL')
  const [filterDomaine, setFilterDomaine] = useState('ALL')
  
  // Liens state
  const [liens, setLiens] = useState<Lien[]>([])
  const [showNewLink, setShowNewLink] = useState(false)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkDomaine, setNewLinkDomaine] = useState('')
  const [creatingLink, setCreatingLink] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Avocat
  const [avocat, setAvocat] = useState<{ id: string; nom: string; prenom: string } | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('avocat')
    if (!stored) {
      router.push('/login-avocat')
      return
    }
    const a = JSON.parse(stored)
    setAvocat(a)
    
    // Fetch dossiers
    fetch(`/api/avocat/dossiers?avocatId=${a.id}`)
      .then(r => r.json())
      .then(data => { if (data.dossiers) setDossiers(data.dossiers) })
      .catch(console.error)
      .finally(() => setLoading(false))
      
    // Fetch liens
    fetch(`/api/avocat/link?avocatId=${a.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLiens(data) })
      .catch(console.error)
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('avocat')
    router.push('/login-avocat')
  }

  // Filter dossiers
  const filteredDossiers = dossiers.filter(d => {
    const q = search.toLowerCase()
    const matchQ = !q ||
      d.reference.toLowerCase().includes(q) ||
      `${d.client.prenom} ${d.client.nom}`.toLowerCase().includes(q) ||
      d.client.email.toLowerCase().includes(q)
    const matchStatut = filterStatut === 'ALL' || d.statut === filterStatut
    const matchDomaine = filterDomaine === 'ALL' || d.domaine === filterDomaine
    return matchQ && matchStatut && matchDomaine
  })

  const stats = {
    total: dossiers.length,
    payes: dossiers.filter(d => d.stripePaid).length,
    analyses: dossiers.filter(d => ['ANALYSE_TERMINEE', 'VALIDE'].includes(d.statut)).length,
    ca: dossiers.filter(d => d.stripePaid).reduce((s, d) => s + d.montantTTC, 0),
  }

  // Create link
  const handleCreateLink = async () => {
    if (!avocat) return
    setCreatingLink(true)
    try {
      const res = await fetch('/api/avocat/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avocatId: avocat.id,
          label: newLinkLabel || null,
          domaine: newLinkDomaine || null,
        })
      })
      const data = await res.json()
      if (data.id) {
        setLiens([data, ...liens])
        setShowNewLink(false)
        setNewLinkLabel('')
        setNewLinkDomaine('')
      }
    } catch (error) {
      console.error('Error creating link:', error)
    } finally {
      setCreatingLink(false)
    }
  }

  // Delete link
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce lien ?')) return
    try {
      await fetch(`/api/avocat/link?linkId=${linkId}`, { method: 'DELETE' })
      setLiens(liens.filter(l => l.id !== linkId))
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  // Copy link
  const handleCopyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/c/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-pearl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pearl-300 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-gold" />
            </div>
            <span className="font-serif font-bold text-lg text-navy">Lexia</span>
            <span className="text-navy/40 text-sm ml-1">Espace avocat</span>
          </div>
          <div className="flex items-center gap-3">
            {avocat && (
              <span className="text-sm text-navy/70">{avocat.prenom} {avocat.nom}</span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-navy/70 hover:text-navy">
              <LogOut className="w-4 h-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total dossiers', value: stats.total },
            { label: 'Payés', value: stats.payes },
            { label: 'Terminés', value: stats.analyses },
            { label: "Chiffre d'affaires", value: `${stats.ca.toFixed(0)}€` },
          ].map((s, i) => (
            <Card key={i} className="border-pearl-300 shadow-paper">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-navy">{s.value}</p>
                <p className="text-xs text-navy/50 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('dossiers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'dossiers' 
                ? 'bg-white shadow-sm text-navy' 
                : 'text-navy/60 hover:text-navy'
            }`}
          >
            <FileText className="w-4 h-4" />
            Dossiers
          </button>
          <button
            onClick={() => setActiveTab('liens')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'liens' 
                ? 'bg-white shadow-sm text-navy' 
                : 'text-navy/60 hover:text-navy'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Mes liens
            <Badge variant="secondary" className="ml-1 bg-pearl text-navy text-xs">
              {liens.length}
            </Badge>
          </button>
        </div>

        {/* Tab: Dossiers */}
        {activeTab === 'dossiers' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
                <Input
                  className="pl-9 border-pearl-300"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 border border-pearl-300 rounded-lg text-sm bg-white"
                value={filterDomaine}
                onChange={(e) => setFilterDomaine(e.target.value)}
              >
                <option value="ALL">Tous les domaines</option>
                {DOMAINS.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {d.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                {['ALL', 'PAYE', 'EN_ANALYSE', 'ANALYSE_TERMINEE'].map(f => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filterStatut === f ? 'default' : 'outline'}
                    className={filterStatut === f ? 'bg-navy' : 'border-pearl-300 text-navy'}
                    onClick={() => setFilterStatut(f)}
                  >
                    {f === 'ALL' ? 'Tous' : STATUS[f]?.label ?? f}
                  </Button>
                ))}
              </div>
            </div>

            {/* Dossiers List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-navy" />
              </div>
            ) : filteredDossiers.length === 0 ? (
              <Card className="border-pearl-300">
                <CardContent className="text-center py-16">
                  <FileText className="w-12 h-12 text-navy/20 mx-auto mb-4" />
                  <p className="text-navy/60 font-medium">Aucun dossier trouvé</p>
                  {dossiers.length === 0 && (
                    <p className="text-sm text-navy/40 mt-2">
                      Partagez votre lien client pour commencer à recevoir des dossiers.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDossiers.map(d => {
                  const st = STATUS[d.statut] ?? { label: d.statut, color: 'bg-slate-100 text-slate-600' }
                  const domain = getDomainById(d.domaine)
                  return (
                    <Card key={d.id} className="border-pearl-300 hover:shadow-paper transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <span className="font-mono text-sm font-semibold text-navy">{d.reference}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                                {st.label}
                              </span>
                              {domain && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${DOMAIN_COLORS[d.domaine] || 'bg-slate-100'}`}>
                                  {domain.icon} {domain.label}
                                </span>
                              )}
                              {d.stripePaid && (
                                <span className="text-xs text-green-600 font-medium">✓ {d.montantTTC}€</span>
                              )}
                              {d.zipEnvoye && (
                                <span className="text-xs text-blue-600">📦 ZIP</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-navy">
                              {d.client.prenom} {d.client.nom}
                            </p>
                            <p className="text-xs text-navy/40 mt-0.5">
                              {d.client.email} · {PAYS[d.client.pays] ?? ''} · {d.documents.length} doc · {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-navy hover:bg-navy/80 flex-shrink-0"
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
          </>
        )}

        {/* Tab: Liens */}
        {activeTab === 'liens' && (
          <>
            {/* Create Link Button & Form */}
            <div className="mb-6">
              {!showNewLink ? (
                <Button 
                  onClick={() => setShowNewLink(true)}
                  className="bg-navy hover:bg-navy/80"
                >
                  <Plus className="w-4 h-4 mr-2" /> Créer un lien
                </Button>
              ) : (
                <Card className="border-pearl-300 bg-navy/5 p-4">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                      <label className="text-xs text-navy/60 block mb-1">Label (optionnel)</label>
                      <Input
                        placeholder="Ex : Carte de visite, LinkedIn..."
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        className="bg-white border-pearl-300"
                      />
                    </div>
                    <div className="min-w-48">
                      <label className="text-xs text-navy/60 block mb-1">Domaine</label>
                      <select
                        className="w-full px-3 py-2 border border-pearl-300 rounded-lg bg-white text-sm"
                        value={newLinkDomaine}
                        onChange={(e) => setNewLinkDomaine(e.target.value)}
                      >
                        <option value="">Au choix du client</option>
                        {DOMAINS.map(d => (
                          <option key={d.id} value={d.id}>{d.icon} {d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreateLink}
                        disabled={creatingLink}
                        className="bg-navy hover:bg-navy/80"
                      >
                        {creatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowNewLink(false)}
                        className="border-pearl-300"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Liens List */}
            {liens.length === 0 ? (
              <Card className="border-pearl-300">
                <CardContent className="text-center py-16">
                  <Link2 className="w-12 h-12 text-navy/20 mx-auto mb-4" />
                  <p className="text-navy/60 font-medium">Créez votre premier lien pour commencer à partager avec vos clients.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {liens.map(lien => {
                  const domain = lien.domaine ? getDomainById(lien.domaine) : null
                  return (
                    <Card key={lien.id} className="border-pearl-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-medium text-navy">
                                {lien.label || 'Lien sans nom'}
                              </span>
                              {domain && (
                                <span className="text-xs bg-pearl px-2 py-0.5 rounded text-navy/70">
                                  {domain.icon} {domain.label}
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-sm text-navy/60 truncate">
                              {window.location.origin}/c/{lien.token}
                            </p>
                            <p className="text-xs text-navy/40 mt-1">
                              {lien.clics} clics · {lien._count.dossiers} dossier(s) · Créé le {new Date(lien.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-pearl-300"
                              onClick={() => handleCopyLink(lien.token, lien.id)}
                            >
                              {copiedId === lien.id ? (
                                <><CheckCircle className="w-4 h-4 text-green-600 mr-1" /> Copié !</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-1" /> Copier</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteLink(lien.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
