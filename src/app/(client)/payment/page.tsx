'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard, Lock, CheckCircle } from 'lucide-react'

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
    // Stripe will redirect on success
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="space-y-2 border-b pb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Analyse juridique IA</span>
            <span>{dossier.montantTTC || 149}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frais de gestion</span>
            <span>{dossier.fraisGestion || 30}€</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total TTC</span>
            <span>{total}€</span>
          </div>
        </div>

        {/* Stripe Payment Element */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Détails du paiement</label>
          <PaymentElement 
            options={{
              layout: 'tabs'
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
              Payer {total}€
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          En cliquant sur "Payer", vous acceptez nos Conditions Générales d'Utilisation
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

    // Fetch dossier info and create payment intent
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
            reference: `DIV-${dossierId.slice(0, 8)}`,
            montantTTC: 149,
            fraisGestion: 30
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error}</p>
            <Button className="w-full mt-4" onClick={() => router.push('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clientSecret || !dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Données de paiement manquantes</p>
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
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Paiement sécurisé
              </CardTitle>
              <CardDescription>
                Référence dossier: {dossier.reference}
              </CardDescription>
            </CardHeader>
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#0f172a',
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
