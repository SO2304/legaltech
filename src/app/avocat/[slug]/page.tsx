'use client'

// ============================================
// PAGE AVOCAT - FORMULAIRE DE DIVORCE
// Route dynamique: /avocat/[slug]
// ============================================

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DivorceForm } from '@/components/forms/divorce-form'
import type { AvocatPublic } from '@/types'
import { AlertCircle, Loader2, Scale } from 'lucide-react'

export default function AvocatPage() {
  const params = useParams()
  const slug = params?.slug as string
  
  const [avocat, setAvocat] = useState<AvocatPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!slug) return
    
    const fetchAvocat = async () => {
      try {
        const response = await fetch(`/api/avocat/${slug}`)
        const result = await response.json()
        
        if (!result.success) {
          setError(result.error || 'Avocat non trouvé')
        } else {
          setAvocat(result.data)
        }
      } catch (err) {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAvocat()
  }, [slug])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement du formulaire...</p>
        </div>
      </div>
    )
  }
  
  if (error || !avocat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Avocat non trouvé
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'Ce lien n\'existe pas ou n\'est plus actif.'}
          </p>
          <a 
            href="/"
            className="text-primary hover:underline"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Header avec branding */}
      <header className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">
                {avocat.cabinet || `Me ${avocat.prenom} ${avocat.nom}`}
              </h1>
              <p className="text-sm text-gray-600">
                Avocat en droit de la famille
              </p>
            </div>
          </div>
          {avocat.ville && (
            <span className="text-sm text-gray-500">{avocat.ville}</span>
          )}
        </div>
      </header>
      
      {/* Formulaire */}
      <main className="max-w-3xl mx-auto">
        <DivorceForm avocat={avocat} />
      </main>
      
      {/* Footer */}
      <footer className="max-w-3xl mx-auto mt-8 text-center text-sm text-gray-500">
        <p>
          Divorce SaaS LegalTech - Plateforme sécurisée de préparation de dossiers
        </p>
        <p className="mt-1">
          Les données sont chiffrées et supprimées automatiquement après 7 jours.
        </p>
      </footer>
    </div>
  )
}
