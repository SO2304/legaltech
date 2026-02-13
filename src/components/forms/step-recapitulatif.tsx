'use client'

// ============================================
// ÉTAPE 7: RÉCAPITULATIF ET SOUMISSION
// ============================================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDivorceForm } from '@/hooks/use-divorce-form'
import { ArrowLeft, Loader2, FileText, Users, Home, Scale } from 'lucide-react'
import { TYPE_PROCEDURE_LABELS, REGIME_MATRIMONIAL_LABELS } from '@/types/dossier'
import { DOCUMENT_TYPE_LABELS } from '@/types/document'
import type { AvocatPublic } from '@/types'

interface StepRecapitulatifProps {
  onNext: () => void
  onPrevious: () => void
  avocat: AvocatPublic
}

export function StepRecapitulatif({ onNext, onPrevious, avocat }: StepRecapitulatifProps) {
  const { data, setConsentement, setSubmitting, setSubmitError, setDossierCreated } = useDivorceForm()
  const [consentGiven, setConsentGiven] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async () => {
    if (!consentGiven) return
    
    setIsSubmitting(true)
    setSubmitting(true)
    
    try {
      // Créer le dossier
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avocatSlug: avocat.slug,
          client: data.demandeur,
          typeProcedure: data.mariage?.typeProcedure,
          regimeMatrimonial: data.mariage?.regimeMatrimonial,
          dateMariage: data.mariage?.dateMariage,
          lieuMariage: data.mariage?.lieuMariage,
          dateSeparation: data.mariage?.dateSeparation,
          motifDivorce: data.mariage?.motifDivorce,
          conjoint: data.conjoint,
          enfants: data.enfants,
          patrimoine: data.patrimoine,
          consentementRGPD: true,
          ipConsentement: await getClientIP(),
        }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création')
      }
      
      // Sauvegarder l'ID du dossier
      setDossierCreated(result.data.id, result.data.reference)
      
      // Déclencher l'analyse RAG
      const analysisResponse = await fetch(`/api/dossiers/${result.data.id}/analyze`, {
        method: 'POST',
      })
      
      if (!analysisResponse.ok) {
        console.error('Erreur analyse:', await analysisResponse.text())
        // On continue quand même, l'analyse peut être relancée
      }
      
      onNext()
      
    } catch (error) {
      console.error('Erreur soumission:', error)
      setSubmitError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setIsSubmitting(false)
      setSubmitting(false)
    }
  }
  
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }
  
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Récapitulatif de votre demande
        </h2>
        <p className="text-gray-600">
          Vérifiez les informations ci-dessous avant de soumettre votre dossier.
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Demandeur */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Vos informations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Nom:</span>
              <span>{data.demandeur?.nom} {data.demandeur?.prenom}</span>
              <span className="text-gray-600">Email:</span>
              <span>{data.demandeur?.email}</span>
              <span className="text-gray-600">Téléphone:</span>
              <span>{data.demandeur?.telephone || 'Non renseigné'}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Conjoint */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Conjoint(e)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Nom:</span>
              <span>{data.conjoint?.nom} {data.conjoint?.prenom}</span>
              <span className="text-gray-600">Email:</span>
              <span>{data.conjoint?.email || 'Non renseigné'}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Mariage */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Mariage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Type procédure:</span>
              <span>{data.mariage?.typeProcedure && TYPE_PROCEDURE_LABELS[data.mariage.typeProcedure]}</span>
              <span className="text-gray-600">Régime:</span>
              <span>{data.mariage?.regimeMatrimonial && REGIME_MATRIMONIAL_LABELS[data.mariage.regimeMatrimonial]}</span>
              <span className="text-gray-600">Date mariage:</span>
              <span>{data.mariage?.dateMariage || 'Non renseignée'}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Enfants */}
        {data.hasEnfants && data.enfants && data.enfants.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Enfants ({data.enfants.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {data.enfants.map((enfant, i) => (
                  <div key={i}>
                    {enfant.prenom} {enfant.nom} ({enfant.dateNaissance})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Documents */}
        {data.documents && data.documents.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Documents ({data.documents.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {data.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>{DOCUMENT_TYPE_LABELS[doc.type]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Avocat */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Me {avocat.prenom} {avocat.nom}</p>
                <p className="text-sm text-gray-600">{avocat.cabinet || avocat.ville}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Consentement RGPD */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            checked={consentGiven}
            onCheckedChange={(checked) => {
              setConsentGiven(checked as boolean)
            }}
          />
          <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
            J'accepte que mes données personnelles soient traitées conformément au RGPD 
            pour les besoins de ma procédure de divorce. Je comprends que mes documents 
            seront automatiquement supprimés après 7 jours et que je recevrai une copie 
            de mes données sur demande.
          </Label>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={!consentGiven || isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Soumission en cours...
            </>
          ) : (
            'Soumettre mon dossier'
          )}
        </Button>
      </div>
    </div>
  )
}
