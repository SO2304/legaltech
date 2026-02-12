'use client'

// ============================================
// ÉTAPE 8: CONFIRMATION
// ============================================

import { useEffect, useState } from 'react'
import { useDivorceForm } from '@/hooks/use-divorce-form'
import { Button } from '@/components/ui/button'
import { CheckCircle, FileText, Clock, Mail } from 'lucide-react'

export function StepConfirmation() {
  const { reference, dossierId } = useDivorceForm()
  const [analysisStatus, setAnalysisStatus] = useState<'pending' | 'analyzing' | 'complete' | 'error'>('pending')
  
  // Polling pour vérifier le statut de l'analyse
  useEffect(() => {
    if (!dossierId) return
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/dossiers/${dossierId}`)
        const result = await response.json()
        
        if (result.success) {
          const statut = result.data.statut
          if (statut === 'EN_ANALYSE') {
            setAnalysisStatus('analyzing')
          } else if (statut === 'ANALYSE_TERMINEE' || statut === 'NOTIFIE') {
            setAnalysisStatus('complete')
          }
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }
    
    // Vérifier immédiatement
    checkStatus()
    
    // Puis toutes les 5 secondes
    const interval = setInterval(checkStatus, 5000)
    
    return () => clearInterval(interval)
  }, [dossierId])
  
  return (
    <div className="p-6 md:p-8 text-center">
      <div className="max-w-md mx-auto">
        {/* Icône de succès */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dossier soumis avec succès !
        </h2>
        
        <p className="text-gray-600 mb-6">
          Votre demande de divorce a été transmise à votre avocat. 
          Vous recevrez une confirmation par email sous peu.
        </p>
        
        {/* Référence */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Votre numéro de dossier</p>
          <p className="text-2xl font-mono font-bold text-primary">
            {reference || 'En cours...'}
          </p>
        </div>
        
        {/* Statut de l'analyse */}
        <div className="space-y-4 text-left mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              analysisStatus !== 'pending' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {analysisStatus !== 'pending' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <FileText className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium">Documents reçus</p>
              <p className="text-sm text-gray-500">Vos pièces ont été enregistrées</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              analysisStatus === 'analyzing' ? 'bg-blue-100 animate-pulse' :
              analysisStatus === 'complete' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {analysisStatus === 'complete' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : analysisStatus === 'analyzing' ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {analysisStatus === 'analyzing' ? 'Analyse en cours...' :
                analysisStatus === 'complete' ? 'Analyse terminée' : 'Analyse IA'}
              </p>
              <p className="text-sm text-gray-500">
                {analysisStatus === 'analyzing' 
                  ? 'Extraction des informations en cours'
                  : analysisStatus === 'complete'
                  ? 'Synthèse générée et envoyée à votre avocat'
                  : 'En attente de traitement'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              analysisStatus === 'complete' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Mail className={`w-5 h-5 ${
                analysisStatus === 'complete' ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="font-medium">Notification avocat</p>
              <p className="text-sm text-gray-500">
                {analysisStatus === 'complete' 
                  ? 'Votre avocat a été notifié par email'
                  : 'En attente de l\'analyse'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Notice RGPD */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
          <p className="text-sm text-amber-800">
            <strong>Rappel RGPD:</strong> Vos documents seront automatiquement 
            supprimés dans 7 jours. Pour les conserver plus longtemps, 
            contactez votre avocat.
          </p>
        </div>
        
        {/* Bouton retour */}
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={() => window.location.reload()}
        >
          Soumettre un nouveau dossier
        </Button>
      </div>
    </div>
  )
}
