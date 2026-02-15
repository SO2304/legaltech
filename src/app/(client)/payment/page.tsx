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
}
