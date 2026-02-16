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
}
