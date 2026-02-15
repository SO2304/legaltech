import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DocumentUploader } from '@/components/client/DocumentUploader'

interface IntakePageProps {
  params: {
    dossierId: string
  }
}

/**
 * Page Intake Client
 * Upload de documents pour un dossier de divorce
 */
export default async function IntakePage({ params }: IntakePageProps) {
  const { dossierId } = params

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

  // Si le dossier est déjà payé, rediriger vers la page de paiement
  if (dossier.stripePaid) {
    redirect(`/confirmation?dossierId=${dossierId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Étape 1/3 : Upload de vos documents
              </h1>
              <p className="text-gray-600 mt-2">
                Référence: <span className="font-mono">{dossier.reference}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Pays détecté</p>
              <p className="font-semibold text-gray-900">{dossier.pays}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Étape 1/3</span>
            <span className="text-sm text-gray-600">Documents</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Document Uploader */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <DocumentUploader dossierId={dossierId} pays={dossier.pays} />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>
                Uploadez tous les documents pertinents (acte de mariage, carte d'identité, bulletins de salaire, etc.)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>
                Notre système analyse automatiquement vos documents avec l'IA
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>
                Vérifiez la qualité et la validation de chaque document
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>
                Une fois tous vos documents uploadés, cliquez sur "Continuer vers le paiement"
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => window.history.back()}
          >
            ← Retour
          </button>

          <a
            href={`/payment?dossierId=${dossierId}`}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${
                dossier.documents.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
              }
            `}
          >
            Continuer vers le paiement →
          </a>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            🔒 Vos documents sont sécurisés et seront automatiquement supprimés 7 jours après validation
          </p>
          <p className="mt-1">
            Conformité RGPD
          </p>
        </div>
      </div>
    </div>
  )
}
