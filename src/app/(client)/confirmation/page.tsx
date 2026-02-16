import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CheckCircle, FileText, Clock, Mail } from 'lucide-react'

interface ConfirmationPageProps {
  searchParams: {
    dossierId?: string
    payment_intent?: string
  }
}

/**
 * Page de confirmation après paiement réussi
 */
export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { dossierId } = searchParams

  if (!dossierId) {
    redirect('/')
  }

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

  if (!dossier.stripePaid) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Paiement confirmé !</h1>
          <p className="text-lg text-slate-500 mb-8">Votre dossier est maintenant en cours de traitement par notre IA.</p>

          <div className="inline-block bg-slate-50 rounded-2xl px-8 py-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Référence du dossier</p>
            <p className="text-2xl font-mono font-bold text-blue-600">{dossier.reference}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Récapitulatif
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Pays</span>
                <span className="font-bold text-slate-900">{dossier.pays}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Documents</span>
                <span className="font-bold text-slate-900">{dossier.documents.length}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-slate-500">Montant payé</span>
                <span className="font-bold text-green-600">149,00 € TTC</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-3xl shadow-lg p-8 text-white">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Prochaines étapes
            </h3>
            <ul className="space-y-4 text-sm font-medium opacity-90">
              <li className="flex gap-3">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">1</span>
                Analyse IA approfondie (10 min)
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">2</span>
                Revue par un avocat
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">3</span>
                Contact sous 48h maximum
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  )
}
