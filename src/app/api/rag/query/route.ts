// ============================================
// API RAG - INTERROGATION TEXTES DE LOIS
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { queryRAG } from '@/lib/rag-service-anthropic'
import { Pays } from '@prisma/client'
import { z } from 'zod'

// ============================================
// VALIDATION SCHEMA
// ============================================
const querySchema = z.object({
  pays: z.nativeEnum(Pays),
  question: z.string().min(10).max(1000),
})

// ============================================
// POST /api/rag/query
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 1. Parser et valider le body
    const body = await request.json()
    const validated = querySchema.parse(body)

    // 2. Appeler le service RAG
    const response = await queryRAG(validated.pays, validated.question)

    // 3. Log pour monitoring
    console.log('✅ RAG Query:', {
      pays: validated.pays,
      question: validated.question.substring(0, 50) + '...',
      sourcesCount: response.sources.length,
      confiance: response.confiance
    })

    // 4. Retourner la réponse
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur API RAG:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET /api/rag/query (pour tester)
// ============================================
export async function GET() {
  return NextResponse.json({
    message: 'RAG API - POST pour interroger',
    usage: {
      method: 'POST',
      body: {
        pays: 'FRANCE | BELGIQUE | SUISSE | LUXEMBOURG',
        question: 'Votre question juridique'
      },
      example: {
        pays: 'FRANCE',
        question: 'Quels sont les cas de divorce possibles ?'
      }
    }
  })
}
