'use client'

// ============================================
// PROGRESS STEPPER - INDICATEUR D'ÉTAPES
// ============================================

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormStep } from '@/types'

interface StepInfo {
  id: FormStep
  label: string
  description: string
}

interface ProgressStepperProps {
  steps: StepInfo[]
  currentStep: FormStep
  completedSteps: FormStep[]
}

export function ProgressStepper({ 
  steps, 
  currentStep, 
  completedSteps 
}: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-between w-full overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const isCurrent = currentStep === step.id
        const isLast = index === steps.length - 1
        
        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            {/* Cercle avec numéro/check */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && !isCompleted && 'bg-primary/20 text-primary border-2 border-primary',
                  !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Label */}
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center whitespace-nowrap',
                  isCurrent ? 'text-primary' : 'text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>
            
            {/* Ligne de connexion */}
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-20px] transition-colors',
                  isCompleted ? 'bg-primary' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
