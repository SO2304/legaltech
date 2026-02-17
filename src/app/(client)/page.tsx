'use client'

import { useEffect, useState } from 'react'
import { Pays } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Loader2, Scale, Brain, Shield } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [pays, setPays] = useState<Pays | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/geolocation')
      .then(r => r.json())
      .then(data => {
        setPays(data.pays)
        setLoading(false)
      })
      .catch(() => {
        setPays(Pays.FRANCE)
        setLoading(false)
      })
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  const countryInfo: Record<Pays, { emoji: string; nom: string }> = {
    [Pays.FRANCE]: { emoji: '🇫🇷', nom: 'France' },
    [Pays.BELGIQUE]: { emoji: '🇧🇪', nom: 'Belgique' },
    [Pays.SUISSE]: { emoji: '🇨🇭', nom: 'Suisse' },
    [Pays.LUXEMBOURG]: { emoji: '🇱🇺', nom: 'Luxembourg' }
  }
  
  const info = countryInfo[pays!]
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl">Divorce Platform</span>
          </div>
          <Button variant="outline">Espace avocat</Button>
        </div>
      </header>
      
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-lg py-2 px-4">
            {info.emoji} {info.nom}
          </Badge>
          
          <h1 className="text-5xl font-bold tracking-tight">
            Analyse automatisée de votre dossier de divorce
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Propulsé par l'intelligence artificielle, basé exclusivement 
            sur les textes de lois officiels
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <Card className="p-6 text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Analyse IA</h3>
              <p className="text-sm text-muted-foreground">
                Extraction automatique avec Claude Vision
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Scale className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Base légale stricte</h3>
              <p className="text-sm text-muted-foreground">
                Citations exclusives des codes officiels
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">RGPD Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Purge automatique après 7 jours
              </p>
            </Card>
          </div>
          
          <div className="pt-8 space-y-4">
            <Button 
              size="lg" 
              className="text-lg px-8 h-12"
              onClick={() => router.push('/intake/demo-' + Date.now())}
            >
              Commencer mon dossier →
            </Button>
            
            <p className="text-sm text-muted-foreground">
              149€ TTC · Analyse complète · Paiement sécurisé
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
