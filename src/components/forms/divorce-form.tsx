'use client'

// ============================================
// FORMULAIRE PRINCIPAL MULTI-ÉTAPES
// Divorce par consentement mutuel
// ============================================

import { useDivorceForm } from '@/hooks/use-divorce-form'
import { ProgressStepper } from '@/components/shared/progress-stepper'
import { StepDemandeur } from './step-demandeur'
import { StepConjoint } from './step-conjoint'
import { StepMariage } from './step-mariage'
import { StepEnfants } from './step-enfants'
import { StepPatrimoine } from './step-patrimoine'
import { StepDocuments } from './step-documents'
import { StepRecapitulatif } from './step-recapitulatif'
import { StepConfirmation } from './step-confirmation'
import type { AvocatPublic } from '@/types'
import { FORM_STEPS } from '@/types/form'

interface DivorceFormProps {
  avocat: AvocatPublic
}

export function DivorceForm({ avocat }: DivorceFormProps) {
  const { 
    currentStep, 
    completedSteps, 
    goToNextStep, 
    goToPreviousStep,
  } = useDivorceForm()
  
  const currentIndex = FORM_STEPS.findIndex(s => s.id === currentStep)
  const progress = ((currentIndex + 1) / FORM_STEPS.length) * 100
  
  const renderStep = () => {
    switch (currentStep) {
      case 'demandeur':
        return <StepDemandeur onNext={goToNextStep} />
      case 'conjoint':
        return <StepConjoint onNext={goToNextStep} onPrevious={goToPreviousStep} />
      case 'mariage':
        return <StepMariage onNext={goToNextStep} onPrevious={goToPreviousStep} />
      case 'enfants':
        return <StepEnfants onNext={goToNextStep} onPrevious={goToPreviousStep} />
      case 'patrimoine':
        return <StepPatrimoine onNext={goToNextStep} onPrevious={goToPreviousStep} />
      case 'documents':
        return <StepDocuments onNext={goToNextStep} onPrevious={goToPreviousStep} />
      case 'recapitulatif':
        return <StepRecapitulatif onNext={goToNextStep} onPrevious={goToPreviousStep} avocat={avocat} />
      case 'confirmation':
        return <StepConfirmation />
      default:
        return null
    }
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header avec branding avocat */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Demande de divorce par consentement mutuel
        </h1>
        <p className="text-gray-600">
          Cabinet {avocat.cabinet || `Me ${avocat.prenom} ${avocat.nom}`}
        </p>
      </div>
      
      {/* Progress stepper */}
      {currentStep !== 'confirmation' && (
        <div className="mb-8">
          <ProgressStepper 
            steps={FORM_STEPS.slice(0, -1)} 
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Contenu de l'étape */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {renderStep()}
      </div>
      
      {/* Footer */}
      {currentStep !== 'confirmation' && (
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Vos données sont protégées conformément au RGPD.
            Les documents seront automatiquement supprimés après 7 jours.
          </p>
        </div>
      )}
    </div>
  )
}
