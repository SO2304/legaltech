import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple password hashing (in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const avocat = await prisma.avocat.findFirst({
      where: { 
        email,
        passwordHash,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        cabinet: true
      }
    })

    if (!avocat) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // In production, set secure HTTP-only cookie
    return NextResponse.json({
      success: true,
      avocat: {
        id: avocat.id,
        email: avocat.email,
        nom: avocat.nom,
        prenom: avocat.prenom,
        cabinet: avocat.cabinet
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur de connexion' },
      { status: 500 }
    )
  }
}
