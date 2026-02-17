'use client'

// ============================================
// FLASHJURIS - LANDING PAGE
// Multi-juridiction: FR, BE, CH, LU
// ============================================

import { useState } from 'react'
import { 
  Scan, 
  Shield, 
  Clock, 
  Euro, 
  CheckCircle, 
  ArrowRight,
  Scale
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Configuration des pays
const COUNTRIES = [
  { 
    code: 'FR', 
    name: 'France', 
    flag: '🇫🇷', 
    price: '149 €',
    currency: 'EUR'
  },
  { 
    code: 'BE', 
    name: 'Belgique', 
    flag: '🇧🇪', 
    price: '159 €',
    currency: 'EUR'
  },
  { 
    code: 'CH', 
    name: 'Suisse', 
    flag: '🇨🇭', 
    price: '149 CHF',
    currency: 'CHF'
  },
  { 
    code: 'LU', 
    name: 'Luxembourg', 
    flag: '🇱🇺', 
    price: '169 €',
    currency: 'EUR'
  },
]

// Avantages
const FEATURES = [
  {
    icon: Scan,
    title: 'Scan & Go',
    description: 'Scannez le QR code de votre avocat et envoyez vos documents en 1 minute.'
  },
  {
    icon: Shield,
    title: 'Données sécurisées',
    description: 'Chiffrement de bout en bout. Données supprimées automatiquement après 7 jours.'
  },
  {
    icon: Clock,
    title: 'Réponse rapide',
    description: 'Votre avocat reçoit immédiatement vos documents par email.'
  },
  {
    icon: Euro,
    title: 'Tarif unique',
    description: 'Un prix clair et transparent, quel que soit le type d\'affaire.'
  },
]

// Étapes
const STEPS = [
  { num: 1, title: 'Scannez', desc: 'Le QR code de votre avocat' },
  { num: 2, title: 'Payez', desc: 'Paiement sécurisé en ligne' },
  { num: 3, title: 'Uploadez', desc: 'Vos documents en toute sécurité' },
  { num: 4, title: 'C\'est tout', desc: 'Votre avocat vous contacte' },
]

export default function HomePage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">FlashJuris</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#comment-ca-marche" className="text-gray-600 hover:text-gray-900">
              Comment ça marche
            </a>
            <a href="#avantages" className="text-gray-600 hover:text-gray-900">
              Avantages
            </a>
            <a href="#securite" className="text-gray-600 hover:text-gray-900">
              Sécurité
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Envoyez vos documents
            <br />
            <span className="text-blue-600">à votre avocat en 1 minute</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Scannez le QR code, payez en ligne, uploadez vos documents. 
            Simple, sécurisé, conforme RGPD.
          </p>
          
          {/* Sélecteur de pays */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-4">Sélectionnez votre pays</p>
            <div className="flex flex-wrap justify-center gap-3">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country.code)}
                  className={cn(
                    'px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2',
                    selectedCountry === country.code
                      ? 'border-blue-600 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="text-left">
                    <div className="font-medium">{country.name}</div>
                    <div className="text-sm text-gray-500">{country.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedCountry && (
            <div className="animate-fade-in">
              <Button size="lg" className="text-lg px-8 py-6">
                Commencer
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Pourquoi FlashJuris ?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader>
                  <feature.icon className="w-10 h-10 text-blue-600 mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section id="securite" className="bg-blue-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Sécurité & Conformité RGPD
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span>Chiffrement AES-256 de vos données</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span>Suppression automatique après 7 jours</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span>Hébergement en Europe (conformité RGPD/LPD)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span>Traçabilité complète des accès</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur">
              <Shield className="w-20 h-20 text-blue-300 mx-auto mb-4" />
              <p className="text-center text-blue-200">
                Vos documents sont traités avec le plus haut niveau de sécurité.
                Après 7 jours, ils sont définitivement supprimés.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold text-white">FlashJuris</span>
              </div>
              <p className="text-sm">
                Service de transfert sécurisé de documents juridiques.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Pays</h4>
              <ul className="space-y-2 text-sm">
                {COUNTRIES.map((c) => (
                  <li key={c.code}>{c.flag} {c.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white">CGV</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <p className="text-sm">contact@flashjuris.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © {new Date().getFullYear()} FlashJuris. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
