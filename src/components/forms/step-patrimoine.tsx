'use client'

// ============================================
// ÉTAPE 5: PATRIMOINE DU COUPLE
// ============================================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useDivorceForm } from '@/hooks/use-divorce-form'
import { ArrowLeft, Home, Wallet, CreditCard } from 'lucide-react'
import type { PatrimoineData } from '@/types/dossier'

interface StepPatrimoineProps {
  onNext: () => void
  onPrevious: () => void
}

export function StepPatrimoine({ onNext, onPrevious }: StepPatrimoineProps) {
  const { setPatrimoine, data } = useDivorceForm()
  
  const [hasPatrimoine, setHasPatrimoine] = useState(data.hasPatrimoine ?? true)
  const [hasImmobilier, setHasImmobilier] = useState(false)
  const [hasEpargne, setHasEpargne] = useState(false)
  const [hasDettes, setHasDettes] = useState(false)
  
  const [patrimoineImmobilier, setPatrimoineImmobilier] = useState('')
  const [patrimoineFinancier, setPatrimoineFinancier] = useState('')
  const [dettes, setDettes] = useState('')
  
  const handleSubmit = () => {
    const patrimoine: PatrimoineData = {
      immobilier: hasImmobilier ? parseTextToArray(patrimoineImmobilier) : [],
      financier: hasEpargne ? parseTextToArray(patrimoineFinancier) : [],
      dettes: hasDettes ? parseTextToArray(dettes) : [],
    }
    
    setPatrimoine(patrimoine, hasPatrimoine)
    onNext()
  }
  
  const parseTextToArray = (text: string) => {
    return text.split('\n').filter(line => line.trim()).map(line => ({
      description: line.trim(),
    }))
  }
  
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Patrimoine du couple
        </h2>
        <p className="text-gray-600">
          Décrivez les biens et dettes à partager. Ces informations aideront l'avocat à préparer la convention.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasPatrimoine"
            checked={hasPatrimoine}
            onCheckedChange={(checked) => setHasPatrimoine(checked as boolean)}
          />
          <Label htmlFor="hasPatrimoine" className="text-base font-normal">
            Nous avons des biens ou des dettes à partager
          </Label>
        </div>
        
        {hasPatrimoine && (
          <div className="space-y-4">
            {/* Immobilier */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Patrimoine immobilier</CardTitle>
                  </div>
                  <Checkbox
                    checked={hasImmobilier}
                    onCheckedChange={(checked) => setHasImmobilier(checked as boolean)}
                  />
                </div>
              </CardHeader>
              {hasImmobilier && (
                <CardContent>
                  <Label className="text-sm text-gray-600">
                    Listez vos biens immobiliers (résidence principale, secondaire, terrains...)
                    avec leur valeur estimée et le nom du propriétaire.
                  </Label>
                  <Textarea
                    className="mt-2"
                    rows={4}
                    placeholder="Ex: Maison 123 rue de Paris, Paris - 350 000€ - propriété commune"
                    value={patrimoineImmobilier}
                    onChange={(e) => setPatrimoineImmobilier(e.target.value)}
                  />
                </CardContent>
              )}
            </Card>
            
            {/* Épargne et placements */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Épargne et placements</CardTitle>
                  </div>
                  <Checkbox
                    checked={hasEpargne}
                    onCheckedChange={(checked) => setHasEpargne(checked as boolean)}
                  />
                </div>
              </CardHeader>
              {hasEpargne && (
                <CardContent>
                  <Label className="text-sm text-gray-600">
                    Listez vos comptes d'épargne, assurances vie, PEA, actions...
                  </Label>
                  <Textarea
                    className="mt-2"
                    rows={4}
                    placeholder="Ex: Livret A LBP - 15 000€ - époux"
                    value={patrimoineFinancier}
                    onChange={(e) => setPatrimoineFinancier(e.target.value)}
                  />
                </CardContent>
              )}
            </Card>
            
            {/* Dettes */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Dettes et crédits</CardTitle>
                  </div>
                  <Checkbox
                    checked={hasDettes}
                    onCheckedChange={(checked) => setHasDettes(checked as boolean)}
                  />
                </div>
              </CardHeader>
              {hasDettes && (
                <CardContent>
                  <Label className="text-sm text-gray-600">
                    Listez vos dettes et crédits en cours (prêt immobilier, crédits conso...).
                  </Label>
                  <Textarea
                    className="mt-2"
                    rows={4}
                    placeholder="Ex: Prêt immobilier Crédit Agricole - 150 000€ restant"
                    value={dettes}
                    onChange={(e) => setDettes(e.target.value)}
                  />
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button type="button" onClick={handleSubmit} size="lg">
          Continuer
        </Button>
      </div>
    </div>
  )
}
