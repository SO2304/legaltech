'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle2, Mail, FileText, Clock, Shield, Scale } from 'lucide-react'

function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dossierId = searchParams.get('dossierId')
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pearl">
      {/* Header minimal */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pearl-300 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-gold" />
            </div>
            <span className="font-serif font-bold text-lg text-navy">Lexia</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          {/* Success icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy mb-2">Paiement réussi !</h1>
            <p className="text-navy/60">
              Votre dossier a été créé et sera traité par votre avocat.
            </p>
          </div>

          {/* Info card */}
          <Card className="mb-8 shadow-paper">
            <CardContent className="pt-6 space-y-4">
              {/* Référence dossier */}
              <div className="flex items-center gap-4 p-3 border-b border-pearl-200">
                <div className="w-10 h-10 bg-pearl rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-navy" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs text-navy/50 uppercase">Référence dossier</p>
                  <p className="font-mono font-bold text-navy">
                    {dossierId ? dossierId.slice(0, 12).toUpperCase() : '—'}
                  </p>
                </div>
              </div>

              {/* Email confirmation */}
              <div className="flex items-center gap-4 p-3 border-b border-pearl-200">
                <div className="w-10 h-10 bg-pearl rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-navy" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs text-navy/50 uppercase">Email de confirmation</p>
                  <p className="text-sm text-navy">Envoyé à votre adresse</p>
                </div>
              </div>

              {/* Traitement */}
              <div className="flex items-center gap-4 p-3 border-b border-pearl-200">
                <div className="w-10 h-10 bg-pearl rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-navy" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs text-navy/50 uppercase">Traitement</p>
                  <p className="text-sm text-navy">Votre avocat reçoit votre dossier dès que tous les documents sont déposés</p>
                </div>
              </div>

              {/* Confidentialité */}
              <div className="flex items-center gap-4 p-3">
                <div className="w-10 h-10 bg-pearl rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-navy" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs text-navy/50 uppercase">Confidentialité</p>
                  <p className="text-sm text-navy">Documents supprimés automatiquement après 7 jours (RGPD)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bouton retour */}
          <Button 
            variant="gold" 
            className="w-full text-base py-6"
            onClick={() => router.push('/')}
          >
            Retour à l'accueil
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
