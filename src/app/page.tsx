'use client'

// ============================================
// FLASHJURIS - LANDING PAGE
// Service 100% gratuit pour les avocats
// Client paie 149€ unique
// ============================================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  QrCode, 
  Mail, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  FileText,
  Send,
  Loader2,
  Banknote,
  Lock
} from 'lucide-react'

export default function FlashJurisLanding() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return
    
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/lawyers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      
      if (res.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setSubmitting(false)
    }
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              QR Code envoyé !
            </h1>
            <p className="text-gray-600 mb-4">
              Votre QR Code personnel vous a été envoyé à <strong>{email}</strong>
            </p>
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-green-800 font-medium text-sm">
                ✅ Service 100% GRATUIT pour vous
              </p>
              <p className="text-green-600 text-xs mt-1">
                Vos clients paient 149€ et vous touchez 20% de commission
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Imprimez le QR Code et posez-le sur votre bureau.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">FlashJuris</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-sm text-gray-500">
              Service 100% gratuit pour les avocats
            </span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
              GRATUIT
            </span>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <QrCode className="w-4 h-4" />
            Flash Juridique
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Recevez les documents de vos clients
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> en 1 scan</span>
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            <strong className="text-gray-900">Gratuit pour vous.</strong> Votre client paie 149€ et vous touchez 20% de commission.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Zéro compte à gérer. Zéro dashboard. Juste un QR code et votre email.
          </p>
          
          {/* Formulaire d'inscription */}
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 border">
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-gray-900">0€</span>
              <span className="text-gray-500 text-sm ml-1">/ vie</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Votre nom (Me Dupont)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl"
                required
              />
              <Input
                type="email"
                placeholder="Votre email professionnel"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                required
              />
              <Button 
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    Recevoir mon QR Code gratuit
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-4 text-center">
              ✓ QR Code instantané par email<br/>
              ✓ Aucun engagement • Aucun paiement requis
            </p>
          </div>
        </div>
      </section>
      
      {/* Comment ça marche */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Simple, rapide, sécurisé. Vous n'avez rien à gérer.
          </p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Mail, title: '1. QR Code', desc: 'Vous recevez votre QR code par email', color: 'blue' },
              { icon: QrCode, title: '2. Client scanne', desc: 'Il paie 149€ et upload ses documents', color: 'indigo' },
              { icon: Send, title: '3. Vous recevez', desc: 'Documents en ZIP directement par email', color: 'purple' },
              { icon: Banknote, title: '4. Commission', desc: 'Vous touchez 29,80€ (20%)', color: 'green' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`w-14 h-14 bg-${item.color}-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing pour le client */}
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Tarif unique pour votre client
            </h2>
            <p className="text-gray-400">
              Transparent et sans surprise
            </p>
          </div>
          
          <div className="max-w-sm mx-auto bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="mb-4">
              <span className="text-5xl font-bold text-gray-900">149€</span>
              <span className="text-gray-500 ml-2">unique</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Payé par le client lors du dépôt
            </p>
            
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Upload illimité de documents
              </div>
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Envoi sécurisé à l'avocat
              </div>
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Documents supprimés après 7 jours
              </div>
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Conformité RGPD garantie
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-800 font-medium text-sm">
                💰 Vous touchez 29,80€ de commission
              </p>
              <p className="text-green-600 text-xs">(20% du prix client)</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Avantages */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            Pourquoi les avocats choisissent FlashJuris
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg bg-white">
              <CardContent className="p-6">
                <Clock className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Gain de temps</h3>
                <p className="text-gray-600 text-sm">
                  Plus d'emails avec pièces jointes éparpillées. 
                  Tout arrive centralisé en ZIP.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg bg-white">
              <CardContent className="p-6">
                <Shield className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Sécurité RGPD</h3>
                <p className="text-gray-600 text-sm">
                  Documents chiffrés et supprimés automatiquement 
                  après 7 jours. Zéro gestion.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg bg-white">
              <CardContent className="p-6">
                <Banknote className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Revenus passifs</h3>
                <p className="text-gray-600 text-sm">
                  20% de commission sur chaque dossier. 
                  Vous n'avez rien à facturer.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Sécurité */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Sécurité maximale</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🗑️ Purge automatique J+7</h3>
              <p className="text-gray-600 text-sm">
                Les données client sont automatiquement supprimées après 7 jours. 
                Pas de stockage inutile.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">📧 Email non ouvert</h3>
              <p className="text-gray-600 text-sm">
                Si vous n'ouvrez pas l'email dans les 7 jours, 
                les données sont supprimées par sécurité.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Final */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à recevoir vos documents en 1 scan ?
          </h2>
          <p className="text-blue-100 mb-8">
            Service 100% gratuit • Commission 20% sur chaque dossier
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-white/90"
              required
            />
            <Button type="submit" variant="secondary" className="h-12 px-8 rounded-xl font-semibold">
              C'est gratuit !
            </Button>
          </form>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <span className="font-semibold">FlashJuris</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 FlashJuris. Transfert sécurisé de documents juridiques.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
