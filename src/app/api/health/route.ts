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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({ error: 'Seed failed', details: errorMessage }, { status: 500 })
    }
  }

  // Debug action to check environment
  if (action === 'debug') {
    const dbUrl = process.env.DATABASE_URL
    const hasDbUrl = !!dbUrl
    const dbUrlMasked = dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'not set'
    
    return NextResponse.json({
      hasDatabaseUrl: hasDbUrl,
      databaseUrl: dbUrlMasked,
      nodeEnv: process.env.NODE_ENV,
      directUrl: process.env.DIRECT_URL ? 'set' : 'not set'
    })
  }

  return NextResponse.json({ status: 'ok', version: '1.0.0' })
}
