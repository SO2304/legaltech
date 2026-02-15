import { CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react'
import { Document } from '@prisma/client'
import { OCRResult } from '@/lib/ocr-service'

interface DocumentValidationProps {
  document: Document
  ocr: OCRResult
  validation: {
    estExige: boolean
    articleLoi?: string
    alertes: string[]
  }
}

/**
 * Composant DocumentValidation
 * Affiche le résultat de l'OCR et de la validation RAG pour un document uploadé
 */
export function DocumentValidation({ document, ocr, validation }: DocumentValidationProps) {
  // Badge de qualité
  const getQualiteBadge = () => {
    switch (ocr.qualiteImage) {
      case 'BONNE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Bonne qualité
          </span>
        )
      case 'MOYENNE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3" />
            Qualité moyenne
          </span>
        )
      case 'FLOUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3" />
            Image floue
          </span>
        )
      case 'ILLISIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Illisible
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{document.nomOriginal}</h3>
          <p className="text-sm text-gray-600 mt-1">Type: {document.type}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getQualiteBadge()}
          <span className="text-xs text-gray-500">
            Confiance: {Math.round(ocr.confiance * 100)}%
          </span>
        </div>
      </div>

      {/* Validation juridique */}
      {validation.estExige && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Document exigé légalement
            </p>
            {validation.articleLoi && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-green-700">
                  {validation.articleLoi}
                </p>
                <button
                  className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900"
                  title="Voir l'article de loi"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alertes */}
      {(ocr.alertes.length > 0 || validation.alertes.length > 0) && (
        <div className="space-y-2">
          {ocr.alertes.map((alerte, i) => (
            <div
              key={`ocr-${i}`}
              className="flex items-start gap-2 p-2 rounded bg-orange-50 border border-orange-200"
            >
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800">{alerte}</p>
            </div>
          ))}
          {validation.alertes.map((alerte, i) => (
            <div
              key={`val-${i}`}
              className="flex items-start gap-2 p-2 rounded bg-yellow-50 border border-yellow-200"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">{alerte}</p>
            </div>
          ))}
        </div>
      )}

      {/* Données extraites */}
      {Object.keys(ocr.donneesExtraites).length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Données extraites
            <span className="ml-2 text-gray-400 group-open:hidden">(cliquer pour voir)</span>
          </summary>
          <div className="mt-2 p-3 rounded bg-gray-50 border border-gray-200">
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify(ocr.donneesExtraites, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {/* Statut de validation */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm text-gray-600">
          Statut:
        </span>
        {document.estValide ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Validé
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3" />
            À vérifier
          </span>
        )}
      </div>
    </div>
  )
}
