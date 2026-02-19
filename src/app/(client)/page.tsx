'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Scale, Brain, Shield, ChevronRight, CheckCircle2, Link2, FileText, Mail, Package } from 'lucide-react'
import { DOMAINS } from '@/lib/domains'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Détection silencieuse
    fetch('/api/geolocation').catch(() => {})
  }, [])

  // 4 étapes selon spec
  const steps = [
    { 
      icon: Scale, 
      title: 'Votre avocat crée un lien', 
      description: 'Maître génère un lien personnalisé pour vous.' 
    },
    { 
      icon: Link2, 
      title: 'Vous complétez le questionnaire', 
      description: 'Via le lien, vous remplissez votre situation juridique.' 
    },
    { 
      icon: FileText, 
      title: 'Vous déposez vos documents', 
      description: 'Photos ou scans de vos pièces justificatives.' 
    },
    { 
      icon: Package, 
      title: 'Votre avocat reçoit le ZIP', 
      description: 'Package complet envoyé automatiquement par email.' 
    },
  ]

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
          <Button
            variant="ghost"
            className="text-navy/70 hover:text-navy hover:bg-pearl-100"
            onClick={() => router.push('/login-avocat')}
          >
            Espace avocat
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-16 pb-12">
        <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-navy/5 rounded-full text-navy/60 text-sm">
            <Scale className="w-4 h-4 text-gold" />
            <span>Tous domaines juridiques couverts</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-navy leading-tight">
            Votre analyse juridique
            <span className="text-gold"> personnalisée</span>
          </h1>
          <p className="text-lg text-navy/60 max-w-xl mx-auto leading-relaxed">
            Service d'analyse juridique assisté par intelligence artificielle. 
            Basé sur les textes de loi officiels.
          </p>
          <p className="text-sm text-navy/40 italic pt-2">
            Accessible uniquement via le lien de votre avocat
          </p>
        </div>
      </section>

      {/* Domain Grid - Read only per spec */}
      <section className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {DOMAINS.map((domain) => (
              <Card 
                key={domain.id}
                className="p-4 bg-white border-pearl-300 shadow-paper text-center cursor-default hover:shadow-paper-lg transition-all duration-300"
              >
                <div className="text-3xl mb-2">{domain.icon}</div>
                <h3 className="font-serif font-semibold text-navy text-sm">{domain.label}</h3>
                <p className="text-xs text-navy/50 mt-1 line-clamp-2">{domain.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-pearl-300 shadow-paper hover:shadow-paper-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-gold" />
            </div>
            <h3 className="font-serif font-semibold text-navy mb-2">Analyse IA</h3>
            <p className="text-sm text-navy/60">Extraction automatique des données via OCR intelligent.</p>
          </Card>
          <Card className="p-6 bg-white border-pearl-300 shadow-paper hover:shadow-paper-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center mb-4">
              <Scale className="w-6 h-6 text-gold" />
            </div>
            <h3 className="font-serif font-semibold text-navy mb-2">Base légale stricte</h3>
            <p className="text-sm text-navy/60">Chaque réponse cite l'article exact du code applicable.</p>
          </Card>
          <Card className="p-6 bg-white border-pearl-300 shadow-paper hover:shadow-paper-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <h3 className="font-serif font-semibold text-navy mb-2">RGPD & Confidentialité</h3>
            <p className="text-sm text-navy/60">Données hébergées en Europe, purgées après 7 jours.</p>
          </Card>
        </div>
      </section>

      {/* How it works - 4 steps per spec */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl font-bold text-navy text-center mb-12">Comment ça marche</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {steps.map((step, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-4 bg-pearl p-5 rounded-xl border border-pearl-300 hover:shadow-paper transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-navy text-sm">{step.title}</h3>
                    <p className="text-xs text-navy/60 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-8 text-navy/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gold" />
            <span className="text-sm">Avocats certifiés</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gold" />
            <span className="text-sm">Hébergement européen</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gold" />
            <span className="text-sm">Paiement sécurisé Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gold" />
            <span className="text-sm">Conforme RGPD</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pearl-300 py-8 bg-white">
        <div className="container mx-auto px-6 text-center text-sm text-navy/40 font-sans">
          © 2026 Lexia
        </div>
      </footer>
    </div>
  )
}
