'use client'

import { useState, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'

// Charger Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  dossierId: string
}

/**
 * Composant PaymentForm
 * Intégration Stripe Elements pour le paiement
 */
export function PaymentForm({ dossierId }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Créer le Payment Intent au chargement
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setError(null)

        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ dossierId })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur lors de la création du paiement')
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (err) {
        console.error('Erreur création Payment Intent:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    }

    createPaymentIntent()
  }, [dossierId])

  // Options pour Stripe Elements
  const options: StripeElementsOptions = {
    clientSecret: clientSecret || '',
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px'
      }
    },
    locale: 'fr'
  }

  // Loading state
  if (!clientSecret && !error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-700">Chargement du formulaire de paiement...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm dossierId={dossierId} />
    </Elements>
  )
}

/**
 * Formulaire de paiement interne
 * Utilise les hooks Stripe
 */
function CheckoutForm({ dossierId }: { dossierId: string }) {
  const stripe = useStripe()
  const elements = useElements()

  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setErrorMessage(null)

    try {
      // Confirmer le paiement
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/confirmation?dossierId=${dossierId}`,
        },
      })

      // Cette partie ne s'exécute que si une erreur survient
      // En cas de succès, l'utilisateur est redirigé vers return_url
      if (error) {
        setErrorMessage(error.message || 'Une erreur est survenue')
      }
    } catch (err) {
      console.error('Erreur paiement:', err)
      setErrorMessage('Une erreur inattendue est survenue')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      <PaymentElement />

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`
          w-full py-3 px-6 rounded-lg font-medium text-white transition-colors
          ${processing || !stripe
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }
        `}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Traitement en cours...
          </span>
        ) : (
          'Payer 149,00 €'
        )}
      </button>

      {/* Notice */}
      <p className="text-xs text-center text-gray-500">
        En cliquant sur "Payer", vous acceptez nos conditions générales de vente
        et notre politique de confidentialité
      </p>
    </form>
  )
}
