<<<<<<< HEAD
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CreditCard, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PaymentPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const dossierId = searchParams.get('dossierId')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePayment = async () => {
        if (!dossierId) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dossierId })
            })

            const data = await response.json()

            if (response.ok && data.url) {
                window.location.href = data.url
            } else {
                throw new Error(data.error || 'Erreur lors de l\'initialisation du paiement')
            }
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    if (!dossierId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 font-medium tracking-tight">ID du dossier non trouvé.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-20 flex items-center justify-center">
            <div className="container px-4 max-w-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-center mx-auto mb-8">
                        <CreditCard className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Finalisation du dossier</h1>
                    <p className="text-slate-500 mb-10 text-lg">
                        Pour lancer l'analyse IA de vos documents, veuillez procéder au règlement sécurisé.
                    </p>

                    <Card className="bg-white border-slate-100 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden mb-8">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-500 font-medium">Analyse IA (France)</span>
                                <span className="text-2xl font-bold text-slate-900">149,00 €</span>
                            </div>
                            <div className="h-px bg-slate-100 w-full mb-6" />
                            <div className="flex justify-between items-center">
                                <span className="text-slate-900 font-bold">Total à payer</span>
                                <span className="text-3xl font-extrabold text-blue-600 tracking-tight">149,00 €</span>
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 animate-pulse">
                            {error}
                        </div>
                    )}

                    <Button
                        size="lg"
                        disabled={loading}
                        onClick={handlePayment}
                        className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xl font-bold shadow-2xl transition-all group"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                Payer avec Stripe
                                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>

                    <div className="mt-10 flex items-center justify-center gap-6 opacity-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4" />
                            Paiement Sécurisé
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <Zap className="w-4 h-4" />
                            Traitement IA immédiat
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
=======
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PaymentForm } from '@/components/client/PaymentForm'

interface PaymentPageProps {
  searchParams: {
    dossierId?: string
  }
}

/**
 * Page de paiement Stripe
 * Étape 2/3 du tunnel client
 */
export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const { dossierId } = searchParams

  if (!dossierId) {
    redirect('/')
  }

  // Récupérer le dossier
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      client: true,
      documents: true
    }
  })

  if (!dossier) {
    notFound()
  }

  // Si déjà payé, rediriger vers confirmation
  if (dossier.stripePaid) {
    redirect(`/confirmation?dossierId=${dossierId}`)
  }

  // Vérifier qu'au moins 1 document a été uploadé
  if (dossier.documents.length === 0) {
    redirect(`/intake/${dossierId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Étape 2/3 : Paiement sécurisé
              </h1>
              <p className="text-gray-600 mt-2">
                Référence: <span className="font-mono">{dossier.reference}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Montant</p>
              <p className="text-2xl font-bold text-gray-900">149,00 €</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Étape 2/3</span>
            <span className="text-sm text-gray-600">Paiement</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '66%' }} />
          </div>
        </div>

        {/* Résumé de la commande */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Résumé de votre commande</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Analyse juridique IA</span>
              <span className="font-medium text-gray-900">149,00 €</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Documents uploadés</span>
              <span className="font-medium text-gray-900">{dossier.documents.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Pays</span>
              <span className="font-medium text-gray-900">{dossier.pays}</span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="text-lg font-semibold text-gray-900">Total TTC</span>
              <span className="text-2xl font-bold text-blue-600">149,00 €</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Ce qui est inclus:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✅ Analyse juridique complète par IA (Claude 3.5 Sonnet)</li>
              <li>✅ Validation des documents obligatoires</li>
              <li>✅ Génération automatique de l'assignation</li>
              <li>✅ Recommandations personnalisées</li>
              <li>✅ Prise en charge avocat sous 48h</li>
              <li>✅ Conformité RGPD (purge automatique J+7)</li>
            </ul>
          </div>
        </div>

        {/* Formulaire de paiement */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Informations de paiement</h2>
          <PaymentForm dossierId={dossierId} />
        </div>

        {/* Sécurité */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Paiement sécurisé par Stripe
          </p>
          <p>Vos données bancaires ne sont jamais stockées sur nos serveurs</p>
        </div>
      </div>
    </div>
  )
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98
}
