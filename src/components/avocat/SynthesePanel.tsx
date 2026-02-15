'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Scale, TrendingUp, TrendingDown, Info } from 'lucide-react'

interface SynthesePanelProps {
  dossier: any
  analyse: any
  sources: any[]
  onDataClick: (documentId: string, zone?: any) => void
}

/**
 * Composant SynthesePanel
 * Affiche les tableaux d'analyse: patrimoine, revenus, charges
 *
 * Features:
 * - Onglets pour naviguer entre les sections
 * - Tableaux avec données clickables
 * - Tooltips pour articles de loi
 * - Totaux calculés
 */
export function SynthesePanel({ dossier, analyse, sources, onDataClick }: SynthesePanelProps) {
  const { patrimoine = [], revenus = [], charges = [], syntheseJuridique, recommandations = [], articlesApplicables = [] } = analyse

  // Calculer les totaux
  const totalPatrimoine = patrimoine.reduce((sum: number, bien: any) => sum + (bien.valeur || 0), 0)
  const totalRevenus = revenus.reduce((sum: number, rev: any) => sum + (rev.montantMensuel || 0), 0)
  const totalCharges = charges.reduce((sum: number, ch: any) => sum + (ch.montantMensuel || 0), 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Synthèse IA - {dossier.reference}
        </h2>
        <p className="text-sm text-gray-600">
          Analyse basée sur {sources.length} source(s) légale(s)
        </p>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="patrimoine" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patrimoine">
            <TrendingUp className="w-4 h-4 mr-2" />
            Patrimoine
          </TabsTrigger>
          <TabsTrigger value="revenus">
            💵 Revenus
          </TabsTrigger>
          <TabsTrigger value="charges">
            <TrendingDown className="w-4 h-4 mr-2" />
            Charges
          </TabsTrigger>
          <TabsTrigger value="synthese">
            <Scale className="w-4 h-4 mr-2" />
            Synthèse
          </TabsTrigger>
        </TabsList>

        {/* Patrimoine */}
        <TabsContent value="patrimoine" className="mt-4">
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead className="text-center">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patrimoine.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      Aucun bien patrimonial identifié
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {patrimoine.map((bien: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{bien.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{bien.nom}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {bien.valeur?.toLocaleString('fr-FR')} €
                        </TableCell>
                        <TableCell>{bien.proprietaire}</TableCell>
                        <TableCell className="text-center">
                          {bien.documentId && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDataClick(bien.documentId)}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Voir le document source
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {bien.articleLoi && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Scale className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  {bien.articleLoi}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 font-bold">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      <TableCell className="text-right">
                        {totalPatrimoine.toLocaleString('fr-FR')} €
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Revenus */}
        <TabsContent value="revenus" className="mt-4">
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead className="text-right">Montant mensuel</TableHead>
                  <TableHead className="text-center">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      Aucun revenu identifié
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {revenus.map((rev: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{rev.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{rev.beneficiaire}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {rev.montantMensuel?.toLocaleString('fr-FR')} €
                        </TableCell>
                        <TableCell className="text-center">
                          {rev.documentId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDataClick(rev.documentId)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-green-50 font-bold">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      <TableCell className="text-right">
                        {totalRevenus.toLocaleString('fr-FR')} €/mois
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Charges */}
        <TabsContent value="charges" className="mt-4">
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant mensuel</TableHead>
                  <TableHead className="text-center">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      Aucune charge identifiée
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {charges.map((ch: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{ch.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{ch.description}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {ch.montantMensuel?.toLocaleString('fr-FR')} €
                        </TableCell>
                        <TableCell className="text-center">
                          {ch.documentId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDataClick(ch.documentId)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 font-bold">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      <TableCell className="text-right">
                        {totalCharges.toLocaleString('fr-FR')} €/mois
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Synthèse juridique */}
        <TabsContent value="synthese" className="mt-4 space-y-4">
          {/* Synthèse */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Synthèse juridique
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{syntheseJuridique}</p>
          </div>

          {/* Recommandations */}
          {recommandations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Recommandations
              </h3>
              <ul className="space-y-2">
                {recommandations.map((reco: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 font-bold">•</span>
                    {reco}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Articles applicables */}
          {articlesApplicables.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                📖 Articles de loi applicables
              </h3>
              <div className="space-y-3">
                {articlesApplicables.map((art: any, index: number) => (
                  <div key={index} className="border-l-4 border-gray-400 pl-3">
                    <p className="font-semibold text-gray-900">{art.article}</p>
                    <p className="text-sm text-gray-700 mt-1">{art.contenu}</p>
                    <p className="text-sm text-gray-600 italic mt-1">
                      Pertinence: {art.pertinence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
