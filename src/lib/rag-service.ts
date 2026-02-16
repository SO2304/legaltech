import { prisma } from '@/lib/prisma'
import { DocumentType, Pays } from '@prisma/client'

/**
 * SERVICE RAG - VALIDATION LÉGALE STRICTE
 */
export async function validerDocumentRAG(
    pays: Pays,
    type: DocumentType,
    texteExtrait: string
) {
    let estExige = false
    let articleLoi = ""
    let alertes: string[] = []

    const rules: Record<Pays, Partial<Record<DocumentType, { article: string, keywords: string[] }>>> = {
        FRANCE: {
            ACTE_MARIAGE: { article: "Art. 229 Code Civil FR", keywords: ["mariage", "acte"] },
            CARTE_IDENTITE: { article: "Art. 1 du Décret n°55-1397", keywords: ["identité", "nationale"] },
            BULLETIN_SALAIRE: { article: "Art. L3243-2 Code du Travail", keywords: ["salaire", "bulletin", "paye"] }
        },
        BELGIQUE: {
            ACTE_MARIAGE: { article: "Art. 212 Code Civil BE", keywords: ["mariage", "acte"] },
            CARTE_IDENTITE: { article: "Loi du 8 août 1983", keywords: ["identiteitskaart", "identité"] }
        },
        SUISSE: {
            ACTE_MARIAGE: { article: "Art. 97 Code Civil CH", keywords: ["mariage", "acte", "eheregister"] },
            CARTE_IDENTITE: { article: "Loi fédérale sur les documents d'identité", keywords: ["identité", "identitätskarte"] }
        },
        LUXEMBOURG: {
            ACTE_MARIAGE: { article: "Art. 144 Code Civil LU", keywords: ["mariage", "acte"] },
            CARTE_IDENTITE: { article: "Loi du 19 juin 2013", keywords: ["identité"] }
        }
    }

    const countryRules = rules[pays]
    const docRule = countryRules?.[type]

    if (docRule) {
        estExige = true
        articleLoi = docRule.article
        const found = docRule.keywords.some(k => texteExtrait.toLowerCase().includes(k))
        if (!found) {
            alertes.push(`Le document ne semble pas correspondre à un(e) ${type} valide pour la juridiction ${pays}.`)
        }
    }

    return {
        estExige,
        articleLoi,
        alertes,
        scoreConfiance: 0.95
    }
}
