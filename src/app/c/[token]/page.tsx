'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Scale, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { DOMAINS, getDomainById, DOMAIN_COLORS } from '@/lib/domains'

interface AvocatInfo {
  id: string
  nom: string
  prenom: string
  cabinet: string | null
}

function ClientLinkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [avocat, setAvocat] = useState<AvocatInfo | null>(null)
  const [domaine, setDomaine] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Lien invalide')
      setLoading(false)
      return
    }

    // Resolve token via API
    fetch(`/api/avocat/link?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setAvocat(data.avocat)
          setDomaine(data.domaine)
        }
      })
      .catch(() => {
        setError('Erreur lors de la vérification du lien')
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleCommencer = async () => {
    if (!avocat) return
    
    // Stocker les infos en session pour le suivi
    sessionStorage.setItem('avocatId', avocat.id)
    sessionStorage.setItem('avocatNom', `${avocat.prenom} ${avocat.nom}`)
    sessionStorage.setItem('linkToken', token || '')
    if (domaine) {
      sessionStorage.setItem('domaine', domaine)
    }
    
    // Créer un nouveau dossier via l'API
    try {
      setLoading(true)
      const res = await fetch('/api/client/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avocatId: avocat.id,
          domaine: domaine,
          linkToken: token,
          // Données client temporaires - seront complétées dans le formulaire
          email: 'pending@pending.com',
          nom: 'pending',
          prenom: 'pending'
        })
      })
      const data = await res.json()
      
      if (data.dossier?.id) {
        // Stocker l'ID du dossier
        sessionStorage.setItem('dossierId', data.dossier.id)
        router.push(`/intake/${data.dossier.id}`)
      } else {
        setError(data.error || 'Erreur lors de la création du dossier')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="font-serif text-xl font-bold text-navy mb-2">Lien invalide</h1>
            <p className="text-navy/60">{error}</p>
            <Button 
              className="mt-6 bg-navy"
              onClick={() => router.push('/')}
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const domainInfo = domaine ? getDomainById(domaine) : null

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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-lg mx-auto">
          <Card className="border-pearl-300 shadow-paper-lg">
            <CardContent className="p-8">
              {/* Lawyer Info */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-navy/5 rounded-full text-navy/60 text-sm mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Lien vérifié</span>
                </div>
                
                <h1 className="font-serif text-2xl font-bold text-navy mb-2">
                  Votre avocat vous attend
                </h1>
                
                {avocat && (
                  <p className="text-navy/70">
                    Maître <span className="font-semibold">{avocat.prenom} {avocat.nom}</span>
                    {avocat.cabinet && <span> - {avocat.cabinet}</span>}
                  </p>
                )}
              </div>

              {/* Domain (if pre-selected) */}
              {domainInfo && (
                <div className="bg-pearl rounded-xl p-4 mb-6">
                  <p className="text-xs text-navy/50 uppercase tracking-wide mb-2">Domaine sélectionné</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{domainInfo.icon}</span>
                    <div>
                      <p className="font-semibold text-navy">{domainInfo.label}</p>
                      <p className="text-sm text-navy/60">{domainInfo.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {!domaine && (
                <div className="bg-pearl rounded-xl p-4 mb-6">
                  <p className="text-xs text-navy/50 uppercase tracking-wide mb-3">Domaines disponibles</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DOMAINS.slice(0, 6).map(d => (
                      <div key={d.id} className="flex items-center gap-2 text-sm text-navy/70">
                        <span>{d.icon}</span>
                        <span>{d.label}</span>
                      </div>
                    ))}
                    {DOMAINS.length > 6 && (
                      <p className="text-xs text-navy/40 col-span-2">
                        +{DOMAINS.length - 6} autres domaines...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* CTA */}
              <Button 
                className="w-full bg-navy hover:bg-navy/80 py-6 text-base"
                onClick={handleCommencer}
              >
                Commencer mon dossier
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-navy/40 text-center mt-4">
                Temps estimé: 5-10 minutes
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    }>
      <ClientLinkPage />
    </Suspense>
  )
}
