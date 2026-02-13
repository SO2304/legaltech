'use client'

// ============================================
// ÉTAPE 3: INFORMATIONS SUR LE MARIAGE
// ============================================

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDivorceForm } from '@/hooks/use-divorce-form'
import { ArrowLeft } from 'lucide-react'
import { 
  TYPE_PROCEDURE_LABELS, 
  REGIME_MATRIMONIAL_LABELS,
  type TypeProcedure,
  type RegimeMatrimonial,
} from '@/types/dossier'

const schema = z.object({
  typeProcedure: z.enum(['CONSENTEMENT_MUTUEL', 'ACCEPTATION_PRINCIPE', 'FAUTE', 'RUPTURE_VIE_COMMUNE']),
  regimeMatrimonial: z.enum(['COMMUNAUTE_REDUITE_ACQUETS', 'COMMUNAUTE_UNIVERSELLE', 'SEPARATION_DE_BIENS', 'PARTICIPATION_AUX_ACQUETS', 'INDETERMINE']),
  dateMariage: z.string().min(1, 'La date de mariage est obligatoire'),
  lieuMariage: z.string().min(1, 'Le lieu de mariage est obligatoire'),
  dateSeparation: z.string().optional(),
  motifDivorce: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface StepMariageProps {
  onNext: () => void
  onPrevious: () => void
}

export function StepMariage({ onNext, onPrevious }: StepMariageProps) {
  const { setMariage, data } = useDivorceForm()
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: data.mariage || {
      typeProcedure: 'CONSENTEMENT_MUTUEL',
      regimeMatrimonial: 'COMMUNAUTE_REDUITE_ACQUETS',
      dateMariage: '',
      lieuMariage: '',
    },
    mode: 'onChange',
  })
  
  const typeProcedure = watch('typeProcedure')
  const regimeMatrimonial = watch('regimeMatrimonial')
  
  const onSubmit = (formData: FormData) => {
    setMariage(formData)
    onNext()
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Informations sur votre mariage
        </h2>
        <p className="text-gray-600">
          Ces informations sont essentielles pour préparer votre dossier de divorce.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Type de procédure *</Label>
          <Select
            value={typeProcedure}
            onValueChange={(value: TypeProcedure) => setValue('typeProcedure', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le type de procédure" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_PROCEDURE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            {typeProcedure === 'CONSENTEMENT_MUTUEL' && 
              'Procédure simplifiée où les deux époux sont d\'accord sur tout.'}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Régime matrimonial *</Label>
          <Select
            value={regimeMatrimonial}
            onValueChange={(value: RegimeMatrimonial) => setValue('regimeMatrimonial', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le régime matrimonial" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REGIME_MATRIMONIAL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            Si vous ne savez pas, c'est généralement la communauté réduite aux acquêts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dateMariage">Date du mariage *</Label>
            <Input
              id="dateMariage"
              type="date"
              {...register('dateMariage')}
              className={errors.dateMariage ? 'border-red-500' : ''}
            />
            {errors.dateMariage && (
              <p className="text-sm text-red-500">{errors.dateMariage.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lieuMariage">Lieu du mariage *</Label>
            <Input
              id="lieuMariage"
              {...register('lieuMariage')}
              placeholder="Ville du mariage"
              className={errors.lieuMariage ? 'border-red-500' : ''}
            />
            {errors.lieuMariage && (
              <p className="text-sm text-red-500">{errors.lieuMariage.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateSeparation">Date de séparation</Label>
          <Input
            id="dateSeparation"
            type="date"
            {...register('dateSeparation')}
          />
          <p className="text-sm text-gray-500">
            Si vous êtes déjà séparé(e), indiquez la date approximative.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="motifDivorce">Motif du divorce (optionnel)</Label>
          <Textarea
            id="motifDivorce"
            {...register('motifDivorce')}
            placeholder="Expliquez brièvement les raisons de votre demande de divorce..."
            rows={3}
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
