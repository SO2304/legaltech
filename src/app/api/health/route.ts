import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  // Seed action to create default avocat
  if (action === 'seed') {
    try {
      const existingAvocat = await prisma.avocat.findFirst()
      
      if (!existingAvocat) {
        const avocat = await prisma.avocat.create({
          data: {
            email: 'test@avocat.fr',
            passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // SHA256 of "password"
            nom: 'Dupont',
            prenom: 'Jean'
          }
        })
        
        return NextResponse.json({ 
          status: 'ok', 
          message: 'Default avocat created',
          avocat: { id: avocat.id, email: avocat.email }
        })
      }
      
      return NextResponse.json({ 
        status: 'ok', 
        message: 'Avocat already exists',
        avocat: { id: existingAvocat.id, email: existingAvocat.email }
      })
    } catch (error) {
      console.error('Seed error:', error)
      return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ status: 'ok', version: '1.0.0' })
}
