'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ConfirmationPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const sessionId = searchParams.get('session_id')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // En prod, on pourrait vérifier la session ici via une API
        // Pour l'instant, on attend un peu pour l'effet visuel
        const timer = setTimeout(() => {
            setLoading(false)
        }, 2000)
        return () => clearTimeout(timer)
    }, [sessionId])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden border-none text-center">
                    <CardContent className="p-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </motion.div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Paiement Réussi !</h1>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Votre dossier est maintenant en cours d'analyse par notre IA. Vous recevrez une notification dès que la synthèse sera prête.
                        </p>

                        <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left">
                            <h4 className="text-blue-900 font-bold text-sm mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Prochaines étapes
                            </h4>
                            <ul className="text-blue-700 text-xs space-y-2">
                                <li>• Analyse OCR de vos documents (1-2 min)</li>
                                <li>• Synthèse juridique RAG stricte</li>
                                <li>• Mise à disposition pour votre avocat</li>
                            </ul>
                        </div>

                        <Button
                            onClick={() => router.push('/')}
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all group"
                        >
                            Retour à l'accueil
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
