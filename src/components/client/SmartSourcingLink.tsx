import { ExternalLink } from 'lucide-react'
import { Pays, DocumentType } from '@prisma/client'
import { getLienPortailGouvernemental, getNomPortail } from '@/lib/smart-sourcing-service'

interface SmartSourcingLinkProps {
  pays: Pays
  type: DocumentType
  className?: string
}

/**
 * Composant SmartSourcingLink
 * Affiche un lien vers le portail gouvernemental officiel
 * pour aider le client à obtenir un document spécifique
 */
export function SmartSourcingLink({ pays, type, className = '' }: SmartSourcingLinkProps) {
  const lien = getLienPortailGouvernemental(pays, type)

  if (!lien) {
    return null
  }

  const nomPortail = getNomPortail(pays)

  return (
    <a
      href={lien}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className}`}
    >
      <ExternalLink className="w-4 h-4" />
      <span>Où trouver ce document ? ({nomPortail})</span>
    </a>
  )
}
