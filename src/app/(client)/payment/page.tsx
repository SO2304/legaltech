'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard, Lock, CheckCircle, ArrowLeft, Scale } from 'lucide-react'

// Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function PaymentForm({ 
  clientSecret, 
  dossierId, 
  dossier 
}: { 
  clientSecret: string
  dossierId: string
  dossier: { id: string; reference: string; montantTTC: number; fraisGestion: number }
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = (dossier.montantTTC || 149) + (dossier.fraisGestion || 30)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation?dossierId=${dossierId}`,
      },
    })

    if (submitError) {
      setError(submitError.message || 'Erreur de paiement')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="space-y-2 border-b pb-4">
          <div className="flex justify-between">
            <span className="text-navy/60">Analyse juridique IA</span>
            <span className="text-navy">{dossier.montantTTC || 149}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy/60">Frais de gestion</span>
            <span className="text-navy">{dossier.fraisGestion || 30}€</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span className="text-navy">Total TTC</span>
            <span className="text-navy">{total}€</span>
          </div>
        </div>

        {/* Stripe Payment Element */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-navy">Détails du paiement</label>
          <PaymentElement 
            options={{
              layout: 'tabs'
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Paiement 100% sécurisé</p>
              <p className="text-sm text-green-700">
                Vos données sont cryptées via Stripe. Nous ne stockons pas vos informations de paiement.
              </p>
            </div>
          </div>
        </div>

        <Button 
          type="submit"
          variant="gold"
          className="w-full h-12 text-lg" 
          disabled={!stripe || processing}
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Traitement en cours...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Payer {total}€ en sécurité
            </>
          )}
        </Button>

        <p className="text-xs text-center text-navy/40">
          Paiement sécurisé par Stripe · Vos données bancaires ne nous sont jamais transmises
        </p>
      </CardContent>
    </form>
  )
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dossierId = searchParams.get('dossierId')
  
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [dossier, setDossier] = useState<{
    id: string
    reference: string
    montantTTC: number
    fraisGestion: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dossierId) {
      setError('Paramètre dossier manquant')
      setLoading(false)
      return
    }

    const initPayment = async () => {
      try {
        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dossierId })
        })
        
        const data = await response.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setDossier({
            id: dossierId,
            reference: data.dossier?.reference || `DIV-${dossierId.slice(0, 8)}`,
            montantTTC: data.dossier?.montantTTC || 149,
            fraisGestion: data.dossier?.fraisGestion || 30
          })
        } else {
          setError(data.error || 'Erreur de paiement')
        }
      } catch (err) {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }

    initPayment()
  }, [dossierId])

  if (loading) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-paper-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clientSecret || !dossier) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <p className="text-navy/60">Données de paiement manquantes</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pearl">
      {/* Header with back button */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pearl-300 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-pearl"
            >
              <ArrowLeft className="w-5 h-5 text-navy" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center">
                <Scale className="w-4 h-4 text-gold" />
              </div>
              <span className="font-serif font-bold text-lg text-navy">Lexia</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="shadow-paper-xl">
            <CardHeader>
              <CardTitle className="font-serif text-navy text-xl">
                Finaliser votre dossier
              </CardTitle>
              <CardDescription className="text-navy/60">
                Référence : <span className="font-mono font-bold">{dossier.reference}</span>
              </CardDescription>
            </CardHeader>
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#011627',
                    colorText: '#011627',
                    colorBackground: '#ffffff',
                  }
                }
              }}
            >
              <PaymentForm 
                clientSecret={clientSecret} 
                dossierId={dossierId!} 
                dossier={dossier} 
              />
            </Elements>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
