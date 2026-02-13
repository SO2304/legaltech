'use client'

// ============================================
// ÉTAPE 1: INFORMATIONS DU DEMANDEUR
// ============================================

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDivorceForm } from '@/hooks/use-divorce-form'
import type { CreateClientInput } from '@/types/client'

const schema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  prenom: z.string().min(1, 'Le prénom est obligatoire'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  profession: z.string().optional(),
})

interface StepDemandeurProps {
  onNext: () => void
}

export function StepDemandeur({ onNext }: StepDemandeurProps) {
  const { setDemandeur, data } = useDivorceForm()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(schema),
    defaultValues: data.demandeur || {
      nom: '',
      prenom: '',
      email: '',
    },
    mode: 'onChange',
  })
  
  const onSubmit = (formData: CreateClientInput) => {
    setDemandeur(formData)
    onNext()
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Vos informations personnelles
        </h2>
        <p className="text-gray-600">
          Ces informations nous permettront de vous identifier et de vous contacter.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom *</Label>
          <Input
            id="nom"
            {...register('nom')}
            placeholder="Votre nom"
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
            placeholder="Votre prénom"
            className={errors.prenom ? 'border-red-500' : ''}
          />
          {errors.prenom && (
            <p className="text-sm text-red-500">{errors.prenom.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="votre@email.com"
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
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="adresse">Adresse</Label>
          <Input
            id="adresse"
            {...register('adresse')}
            placeholder="Numéro et nom de rue"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="codePostal">Code postal</Label>
          <Input
            id="codePostal"
            {...register('codePostal')}
            placeholder="75001"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ville">Ville</Label>
          <Input
            id="ville"
            {...register('ville')}
            placeholder="Paris"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="profession">Profession</Label>
          <Input
            id="profession"
            {...register('profession')}
            placeholder="Votre profession"
          />
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <Button type="submit" disabled={!isValid} size="lg">
          Continuer
        </Button>
      </div>
    </form>
  )
}
