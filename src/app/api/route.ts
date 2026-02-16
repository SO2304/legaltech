<<<<<<< HEAD
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}
=======
// ============================================
// API ROOT - FlashJuris
// Point d'entrée de l'API
// ============================================

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'FlashJuris API',
    version: '1.0.0',
    description: 'API pour la plateforme de révision juridique FlashJuris',
    endpoints: {
      health: '/api/health',
      flashcards: {
        list: 'GET /api/flashcards',
        create: 'POST /api/flashcards',
        get: 'GET /api/flashcards/[id]',
        update: 'PATCH /api/flashcards/[id]',
        delete: 'DELETE /api/flashcards/[id]',
      },
      studySessions: {
        list: 'GET /api/study-sessions',
        create: 'POST /api/study-sessions',
        answer: 'POST /api/study-sessions/[id]/answer',
        complete: 'POST /api/study-sessions/[id]/complete',
      },
    },
    documentation: '/docs/API_ROUTES.md',
  })
}
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98
