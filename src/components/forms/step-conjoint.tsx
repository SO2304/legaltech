'use client'

// ============================================
// ÉTAPE 2: INFORMATIONS DU CONJOINT
// ============================================

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDivorceForm } from '@/hooks/use-divorce-form'
import { ArrowLeft } from 'lucide-react'
import type { ConjointData } from '@/types/dossier'

const schema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  prenom: z.string().min(1, 'Le prénom est obligatoire'),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  profession: z.string().optional(),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
})

interface StepConjointProps {
  onNext: () => void
  onPrevious: () => void
}

export function StepConjoint({ onNext, onPrevious }: StepConjointProps) {
  const { setConjoint, data } = useDivorceForm()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ConjointData>({
    resolver: zodResolver(schema),
    defaultValues: data.conjoint || {
      nom: '',
      prenom: '',
      email: '',
    },
    mode: 'onChange',
  })
  
  const onSubmit = (formData: ConjointData) => {
    setConjoint(formData)
    onNext()
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Informations sur votre conjoint(e)
        </h2>
        <p className="text-gray-600">
          Renseignez les informations concernant votre époux(se) pour faciliter la procédure.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom *</Label>
          <Input
            id="nom"
            {...register('nom')}
            placeholder="Nom de votre conjoint(e)"
            className={errors.nom ? 'border-red-500' : ''}
          />
          {errors.nom && (
            <p className="text-sm text-red-500">{errors.nom.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom *</Label>
          <Input
            id="prenom"
            {...register('prenom')}
            placeholder="Prénom de votre conjoint(e)"
            className={errors.prenom ? 'border-red-500' : ''}
          />
          {errors.prenom && (
            <p className="text-sm text-red-500">{errors.prenom.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemple.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            {...register('telephone')}
            placeholder="06 12 34 56 78"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateNaissance">Date de naissance</Label>
          <Input
            id="dateNaissance"
            type="date"
            {...register('dateNaissance')}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
          <Input
            id="lieuNaissance"
            {...register('lieuNaissance')}
            placeholder="Ville de naissance"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="profession">Profession</Label>
          <Input
            id="profession"
            {...register('profession')}
            placeholder="Profession"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="adresse">Adresse actuelle</Label>
          <Input
            id="adresse"
            {...register('adresse')}
            placeholder="Adresse"
          />
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button type="submit" disabled={!isValid} size="lg">
          Continuer
        </Button>
      </div>
    </form>
  )
}
