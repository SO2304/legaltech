'use client'

// ============================================
// FLASHJURIS - LANDING PAGE
// "Scan-to-Report" pour avocats
// ============================================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  QrCode, 
  Mail, 
  Sparkles, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  FileText,
  Send,
  Loader2
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
              Bienvenue sur FlashJuris !
            </h1>
            <p className="text-gray-600 mb-4">
              Votre QR Code personnalisé vous a été envoyé à <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Imprimez-le et posez-le sur votre bureau pour recevoir les documents de vos clients.
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
          <nav className="hidden md:flex items-center gap-6">
            <a href="#comment" className="text-gray-600 hover:text-gray-900 text-sm">Comment ça marche</a>
            <a href="#tarifs" className="text-gray-600 hover:text-gray-900 text-sm">Tarifs</a>
            <Button variant="outline" size="sm">Connexion</Button>
          </nav>
        </div>
      </header>
      
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <QrCode className="w-4 h-4" />
            Scan-to-Report
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Recevez les documents de vos clients
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> en un scan</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Donnez-nous votre email, nous vous envoyons votre QR Code. 
            Vos clients scannent, vous recevez une analyse IA directement dans votre boîte mail.
          </p>
          
          {/* Formulaire d'inscription */}
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Votre nom"
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
                    Création en cours...
                  </>
                ) : (
                  <>
                    Recevoir mon QR Code
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Gratuit • Sans engagement • Prêt en 30 secondes
            </p>
          </div>
        </div>
      </section>
      
      {/* Processus */}
      <section id="comment" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Zéro dashboard à gérer. Zéro application à télécharger. 
            Juste un QR code et votre email.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Vous recevez votre QR Code</h3>
              <p className="text-gray-600 text-sm">
                Par email, prêt à imprimer. Posez-le sur votre bureau.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Le client scanne</h3>
              <p className="text-gray-600 text-sm">
                Il remplit ses infos et upload ses documents en 2 minutes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
                <Send className="w-8 h-8 text-white" />
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600 font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Vous recevez le rapport</h3>
              <p className="text-gray-600 text-sm">
                Analyse IA complète envoyée directement dans votre boîte mail.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Avantages */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Pourquoi les avocats adorent FlashJuris
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <Clock className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Gain de temps</h3>
                <p className="text-gray-600 text-sm">
                  Plus d'emails avec des pièces jointes éparpillées. 
                  Tout arrive centralisé et analysé.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <Sparkles className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Analyse IA incluse</h3>
                <p className="text-gray-600 text-sm">
                  Chaque dossier est pré-analysé par notre IA. 
                  Points clés, risques, recommandations.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <Shield className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">RGPD ready</h3>
                <p className="text-gray-600 text-sm">
                  Documents chiffrés et supprimés automatiquement après 30 jours.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Tarifs */}
      <section id="tarifs" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Tarifs simples
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Payez uniquement ce que vous utilisez
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-200 rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <h3 className="font-bold text-xl text-gray-900 mb-2">Découverte</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">Gratuit</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    5 analyses par mois
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    QR Code personnalisé
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Rapports par email
                  </li>
                </ul>
                <Button variant="outline" className="w-full rounded-xl">
                  Commencer gratuitement
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-blue-500 rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                Populaire
              </div>
              <CardContent className="p-8">
                <h3 className="font-bold text-xl text-gray-900 mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">19€</span>
                  <span className="text-gray-600">/mois</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Analyses illimitées
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Support prioritaire
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Historique des dossiers
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Exports PDF personnalisés
                  </li>
                </ul>
                <Button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600">
                  Passer au Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à simplifier la réception de vos documents ?
          </h2>
          <p className="text-blue-100 mb-8">
            Rejoignez les avocats qui gagnent du temps avec FlashJuris
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
              C'est parti !
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
              © 2024 FlashJuris. Analyse juridique intelligente.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
