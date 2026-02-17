'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, Mail, FileText, Clock } from 'lucide-react'

function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dossierId = searchParams.get('dossierId')
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate processing delay
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">Divorce Platform</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Paiement réussi !</h1>
            <p className="text-muted-foreground">
              Votre dossier a été créé et sera analysé par notre système d'IA
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Numéro de dossier</p>
                  <p className="text-sm text-muted-foreground">DIV-{dossierId?.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Email de confirmation</p>
                  <p className="text-sm text-muted-foreground">Envoyé à votre adresse email</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Délai d'analyse</p>
                  <p className="text-sm text-muted-foreground">Environ 5-10 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Vos documents seront automatiquement purgés après 7 jours 
              conformément à notre politique RGPD. Téléchargez vos résultats avant cette date.
            </p>
          </div>

          <div className="space-y-4">
            <Button className="w-full" onClick={() => router.push('/')}>
              Retour à l'accueil
            </Button>
            <p className="text-sm text-muted-foreground">
              Vous pouvez suivre l'avancement de votre dossier depuis votre espace avocat
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
