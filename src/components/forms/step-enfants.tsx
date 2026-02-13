'use client'

// ============================================
// ÉTAPE 4: ENFANTS DU COUPLE
// ============================================

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { useDivorceForm } from '@/hooks/use-divorce-form'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { EnfantData } from '@/types/dossier'

const enfantSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  prenom: z.string().min(1, 'Le prénom est obligatoire'),
  dateNaissance: z.string().min(1, 'La date de naissance est obligatoire'),
  aCharge: z.boolean().default(true),
})

const schema = z.object({
  hasEnfants: z.boolean(),
  enfants: z.array(enfantSchema).optional(),
})

type FormData = z.infer<typeof schema>

interface StepEnfantsProps {
  onNext: () => void
  onPrevious: () => void
}

export function StepEnfants({ onNext, onPrevious }: StepEnfantsProps) {
  const { setEnfants, data } = useDivorceForm()
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      hasEnfants: data.hasEnfants ?? false,
      enfants: data.enfants && data.enfants.length > 0 
        ? data.enfants as EnfantData[]
        : [{ nom: '', prenom: '', dateNaissance: '', aCharge: true }],
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'enfants',
  })
  
  const hasEnfants = watch('hasEnfants')
  
  const onSubmit = (formData: FormData) => {
    setEnfants(
      formData.hasEnfants ? (formData.enfants || []) as EnfantData[] : [],
      formData.hasEnfants
    )
    onNext()
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Enfants du couple
        </h2>
        <p className="text-gray-600">
          Renseignez les informations sur les enfants nés de votre union.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasEnfants"
            checked={hasEnfants}
            onCheckedChange={(checked) => setValue('hasEnfants', checked as boolean)}
          />
          <Label htmlFor="hasEnfants" className="text-base font-normal">
            Nous avons des enfants ensemble
          </Label>
        </div>
        
        {hasEnfants && (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-gray-900">
                      Enfant {index + 1}
                    </h3>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input
                        {...register(`enfants.${index}.nom`)}
                        placeholder="Nom de l'enfant"
                      />
                      {errors.enfants?.[index]?.nom && (
                        <p className="text-sm text-red-500">
                          {errors.enfants[index]?.nom?.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Prénom *</Label>
                      <Input
                        {...register(`enfants.${index}.prenom`)}
                        placeholder="Prénom de l'enfant"
                      />
                      {errors.enfants?.[index]?.prenom && (
                        <p className="text-sm text-red-500">
                          {errors.enfants[index]?.prenom?.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Date de naissance *</Label>
                      <Input
                        type="date"
                        {...register(`enfants.${index}.dateNaissance`)}
                      />
                      {errors.enfants?.[index]?.dateNaissance && (
                        <p className="text-sm text-red-500">
                          {errors.enfants[index]?.dateNaissance?.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        {...register(`enfants.${index}.aCharge`)}
                        defaultChecked
                      />
                      <Label className="font-normal">
                        À charge
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ nom: '', prenom: '', dateNaissance: '', aCharge: true })}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un enfant
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button type="submit" size="lg">
          Continuer
        </Button>
      </div>
    </form>
  )
}
