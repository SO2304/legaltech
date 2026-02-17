'use client'

import { useEffect, useState } from 'react'
import { Pays } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Scale, Brain, Shield } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Détection silencieuse — jamais affichée à l'utilisateur
    fetch('/api/geolocation').catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-7 h-7 text-slate-800" />
            <span className="font-bold text-xl text-slate-800">Lexia</span>
          </div>
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-slate-900"
            onClick={() => router.push('/login-avocat')}
          >
            Espace avocat
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold text-slate-900 leading-tight">
            Analyse juridique de votre dossier de divorce
          </h1>
          <p className="text-xl text-slate-500 max-w-xl mx-auto">
            Basée exclusivement sur les textes de loi officiels, propulsée par l'intelligence artificielle.
          </p>
          <div className="pt-4">
            <Button
              size="lg"
              className="text-base px-10 bg-slate-900 hover:bg-slate-700 text-white rounded-xl shadow-lg"
              onClick={() => router.push('/intake/new-' + Date.now())}
            >
              Commencer →
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <Card className="p-6 border border-slate-100 shadow-sm">
            <Brain className="w-10 h-10 mb-4 text-slate-700" />
            <h3 className="font-semibold text-slate-900 mb-2">Analyse IA</h3>
            <p className="text-sm text-slate-500">Extraction automatique des données via Claude Vision OCR.</p>
          </Card>
          <Card className="p-6 border border-slate-100 shadow-sm">
            <Scale className="w-10 h-10 mb-4 text-slate-700" />
            <h3 className="font-semibold text-slate-900 mb-2">Base légale stricte</h3>
            <p className="text-sm text-slate-500">Chaque réponse cite l'article exact du code civil applicable.</p>
          </Card>
          <Card className="p-6 border border-slate-100 shadow-sm">
            <Shield className="w-10 h-10 mb-4 text-slate-700" />
            <h3 className="font-semibold text-slate-900 mb-2">RGPD & Confidentialité</h3>
            <p className="text-sm text-slate-500">Données hébergées en Europe, purgées après 7 jours.</p>
          </Card>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Comment ça fonctionne</h2>
            <div className="space-y-4">
              {[
                { n: '1', titre: 'Remplissez le questionnaire', desc: 'Informations personnelles et situation conjugale.' },
                { n: '2', titre: 'Téléversez vos documents', desc: "Carte d'identité, acte de mariage, bulletins de salaire..." },
                { n: '3', titre: 'Obtenez votre analyse', desc: "Un avocat examine votre dossier et vous envoie l'analyse complète." },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-4 bg-white p-5 rounded-xl border border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{s.titre}</h3>
                    <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button
                size="lg"
                className="text-base px-10 bg-slate-900 hover:bg-slate-700 text-white rounded-xl"
                onClick={() => router.push('/intake/new-' + Date.now())}
              >
                Commencer mon dossier →
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-sm text-slate-400">
          © 2026 Lexia · Conforme RGPD · Hébergement Europe
        </div>
      </footer>
    </div>
  )
}
