import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const avocat = await prisma.avocat.findFirst({
      where: { 
        email,
        isActive: true
      }
    })

    if (!avocat) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, avocat.passwordHash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

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
