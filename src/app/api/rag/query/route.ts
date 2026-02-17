import { NextRequest, NextResponse } from 'next/server'
import { queryRAG } from '@/lib/rag-service'
import { Pays } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { pays, question } = await request.json()
    const result = await queryRAG(pays as Pays, question)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur RAG' }, { status: 500 })
  }
}
