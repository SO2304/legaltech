'use client'

// ============================================
// PAGE D'ACCUEIL - LANDING PAGE
// ============================================

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl">Divorce SaaS</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/demo" className="text-sm text-gray-600 hover:text-gray-900">
              Démo
            </Link>
            <Button variant="outline" size="sm">
              Espace avocat
            </Button>
          </nav>
        </div>
      </header>
      
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Préparez votre dossier de divorce
            <span className="text-primary block mt-2">en toute simplicité</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Un processus 100% en ligne, sécurisé et confidentiel. 
            Remplissez votre formulaire, téléchargez vos documents, 
            et recevez une analyse personnalisée par votre avocat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/avocat/demo-avocat">
              <Button size="lg" className="w-full sm:w-auto">
                Commencer ma demande
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>100% Sécurisé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Vos données sont chiffrées de bout en bout. Les documents sont 
                automatiquement supprimés après 7 jours conformément au RGPD.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Rapide</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Remplissez le formulaire en 15 minutes. L'IA analyse vos documents 
                et génère une synthèse pour votre avocat en quelques minutes.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Sans paperasse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Tout se fait en ligne : formulaire intelligent, upload de documents, 
                suivi en temps réel. Plus besoin de vous déplacer.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Process */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Comment ça fonctionne ?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Choisissez votre avocat', desc: 'Accédez au formulaire via le lien personnalisé de votre avocat' },
              { step: 2, title: 'Remplissez le formulaire', desc: 'Informations personnelles, mariage, enfants, patrimoine' },
              { step: 3, title: 'Téléchargez vos documents', desc: 'Pièces d\'identité, justificatifs financiers, titres de propriété' },
              { step: 4, title: 'Recevez votre analyse', desc: 'Votre avocat reçoit une synthèse complète de votre dossier' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à démarrer votre procédure ?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Notre système intelligent vous guide à chaque étape. 
            Votre avocat recevra un dossier complet et bien préparé.
          </p>
          <Link href="/avocat/demo-avocat">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              Accéder au formulaire de démonstration
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            <span className="font-semibold">Divorce SaaS LegalTech</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2024 Divorce SaaS. Plateforme réservée aux professionnels du droit.
          </p>
        </div>
      </footer>
    </div>
  )
}
