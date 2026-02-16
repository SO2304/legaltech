import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PaymentForm } from '@/components/client/PaymentForm'
import { ShieldCheck, Zap, CreditCard, Clock } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
            <span className="font-semibold text-slate-400">Documents</span>
          </div>
          <div className="h-px w-12 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-100">2</div>
            <span className="font-semibold text-slate-900">Paiement</span>
          </div>
          <div className="h-px w-12 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold">3</div>
            <span className="font-semibold text-slate-400">Analyse</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 mb-8">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-50">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Paiement sécurisé</h1>
              <p className="text-slate-500 mt-1">Référence: <span className="font-mono font-bold text-blue-600">{dossier.reference}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total à régler</p>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">149,00 €</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-bold text-slate-900 mb-4">Résumé de l'offre</h2>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 space-y-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-blue-900 text-sm">Analyse IA (Claude 3.5 Sonnet)</p>
                  <p className="text-blue-700 text-xs">Extraction de données et validation de conformité en temps réel.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-blue-900 text-sm">Prise en charge avocat</p>
                  <p className="text-blue-700 text-xs">Validation finale et dépôt de votre dossier par un avocat agréé.</p>
                </div>
              </div>
            </div>
          </div>

          <PaymentForm dossierId={dossierId} />
        </div>

        <div className="flex items-center justify-center gap-8 opacity-50 grayscale">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <CreditCard className="w-4 h-4" />
            Stripe Secure
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Clock className="w-4 h-4" />
            Délai 48h
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            RGPD Compliant
          </div>
        </div>
      </div>
    </div>
  )
}
