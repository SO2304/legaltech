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
 * Étape 3/3 du tunnel client
 */
export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { dossierId, payment_intent } = searchParams

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

  // Si pas encore payé, rediriger vers paiement
  if (!dossier.stripePaid) {
    redirect(`/payment?dossierId=${dossierId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-600">Étape 3/3</span>
            <span className="text-sm text-gray-600">Confirmation</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Confirmation principale */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement confirmé !
          </h1>

          <p className="text-lg text-gray-600 mb-6">
            Votre dossier est maintenant en cours de traitement
          </p>

          <div className="inline-block bg-gray-100 rounded-lg px-6 py-3">
            <p className="text-sm text-gray-600 mb-1">Référence de votre dossier</p>
            <p className="text-xl font-mono font-bold text-gray-900">
              {dossier.reference}
            </p>
          </div>
        </div>

        {/* Informations du dossier */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Pays</span>
              <span className="font-medium text-gray-900">{dossier.pays}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Documents uploadés</span>
              <span className="font-medium text-gray-900">{dossier.documents.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Montant payé</span>
              <span className="font-medium text-green-600">149,00 € TTC</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Date de paiement</span>
              <span className="font-medium text-gray-900">
                {dossier.stripePaidAt
                  ? new Date(dossier.stripePaidAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'En cours...'}
              </span>
            </div>
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-4">📋 Prochaines étapes</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-blue-900">Analyse IA en cours</p>
                <p className="text-sm text-blue-700 mt-1">
                  Notre système analyse vos documents et génère l'assignation (environ 10 minutes)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-blue-900">Prise en charge avocat</p>
                <p className="text-sm text-blue-700 mt-1">
                  Un avocat spécialisé reviendra vers vous sous 48h maximum
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-blue-900">Finalisation du dossier</p>
                <p className="text-sm text-blue-700 mt-1">
                  Validation finale et dépôt de votre dossier au tribunal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations importantes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900 mb-1">Email de confirmation</p>
            <p className="text-sm text-gray-600">
              Envoyé à {dossier.client.email}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900 mb-1">Délai moyen</p>
            <p className="text-sm text-gray-600">
              Réponse sous 48h
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900 mb-1">Suivi en ligne</p>
            <p className="text-sm text-gray-600">
              Bientôt disponible
            </p>
          </div>
        </div>

        {/* RGPD */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-600">
          <p className="mb-1">
            🔒 <strong>Conformité RGPD</strong> : Vos documents sont sécurisés
          </p>
          <p>
            Ils seront automatiquement supprimés 7 jours après validation de votre dossier
          </p>
        </div>

        {/* Action */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  )
}
