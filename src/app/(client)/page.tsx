'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Scale, Brain, Shield, ChevronRight, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Détection silencieuse
    fetch('/api/geolocation').catch(() => {})
  }, [])

  const steps = [
    { n: '1', titre: 'Remplissez le questionnaire', desc: 'Vos informations et situation conjugale.' },
    { n: '2', titre: 'Téléversez vos documents', desc: 'Carte identité, acte de mariage, bulletins de salaire...' },
    { n: '3', titre: 'Obtenez votre analyse', desc: 'Un avocat examine votre dossier et vous envoie l\'analyse complète.' },
  ]

  return (
    <div className="min-h-screen bg-pearl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pearl-300 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-gold" />
            </div>
            <span className="font-serif font-bold text-xl text-navy">Lexia</span>
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
      <section className="container mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-navy leading-tight">
            Analyse juridique de votre{' '}
            <span className="text-gold">divorce</span>
          </h1>
          <p className="text-xl text-navy/60 max-w-xl mx-auto leading-relaxed">
            Basée exclusivement sur les textes de loi officiels, propulsée par l'intelligence artificielle.
          </p>
          <div className="pt-6">
            <Button
              size="lg"
              variant="gold"
              className="text-base px-10 py-6"
              onClick={() => router.push('/intake/new-' + Date.now())}
            >
              Commencer mon dossier
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
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
            <p className="text-sm text-navy/60">Extraction automatique des données via Claude Vision OCR.</p>
          </Card>
          <Card className="p-6 bg-white border-pearl-300 shadow-paper hover:shadow-paper-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center mb-4">
              <Scale className="w-6 h-6 text-gold" />
            </div>
            <h3 className="font-serif font-semibold text-navy mb-2">Base légale stricte</h3>
            <p className="text-sm text-navy/60">Chaque réponse cite l'article exact du code civil applicable.</p>
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

      {/* How it works Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl font-bold text-navy text-center mb-12">Comment ça fonctionne</h2>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div 
                  key={s.n} 
                  className="flex items-start gap-5 bg-pearl p-5 rounded-xl border border-pearl-300 hover:shadow-paper transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-serif font-bold text-sm flex-shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-navy">{s.titre}</h3>
                    <p className="text-sm text-navy/60 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button
                size="lg"
                variant="gold"
                className="text-base px-10"
                onClick={() => router.push('/intake/new-' + Date.now())}
              >
                Commencer maintenant
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
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
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pearl-300 py-8 bg-white">
        <div className="container mx-auto px-6 text-center text-sm text-navy/40 font-sans">
          © 2026 Lexia · Conforme RGPD · Hébergement Europe
        </div>
      </footer>
    </div>
  )
}
