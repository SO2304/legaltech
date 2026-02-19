import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/avocat/link - Liste les liens d'un avocat
// GET /api/avocat/link?token=xxx - Résout un token (pour /c/[token])
// GET /api/avocat/link?linkId=xxx - Supprime un lien
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const avocatId = searchParams.get('avocatId')
  const linkId = searchParams.get('linkId')

  // Résolution de token (pour page client /c/[token])
  if (token) {
    try {
      const lien = await prisma.lien.findUnique({
        where: { token },
        include: {
          avocat: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              cabinet: true,
            },
          },
        },
      })

      if (!lien) {
        return NextResponse.json(
          { error: 'Lien invalide ou expiré' },
          { status: 404 }
        )
      }

      // Incrémenter le compteur de clics
      await prisma.lien.update({
        where: { id: lien.id },
        data: { clics: { increment: 1 } },
      })

      return NextResponse.json({
        valid: true,
        avocat: {
          id: lien.avocat.id,
          nom: lien.avocat.nom,
          prenom: lien.avocat.prenom,
          cabinet: lien.avocat.cabinet,
        },
        domaine: lien.domaine,
      })
    } catch (error) {
      console.error('Error resolving token:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la résolution du lien' },
        { status: 500 }
      )
    }
  }

  // Liste des liens d'un avocat
  if (avocatId) {
    try {
      const liens = await prisma.lien.findMany({
        where: { avocatId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              dossiers: true,
            },
          },
        },
      })

      return NextResponse.json(liens)
    } catch (error) {
      console.error('Error fetching liens:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des liens' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Paramètres manquants' },
    { status: 400 }
  )
}

// POST /api/avocat/link - Crée un nouveau lien
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { avocatId, label, domaine } = body

    if (!avocatId) {
      return NextResponse.json(
        { error: 'ID avocat requis' },
        { status: 400 }
      )
    }

    // Générer un token unique
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15)

    const lien = await prisma.lien.create({
      data: {
        token,
        avocatId,
        label,
        domaine,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      },
    })

    return NextResponse.json(lien)
  } catch (error) {
    console.error('Error creating lien:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du lien' },
      { status: 500 }
    )
  }
}

// DELETE /api/avocat/link?linkId=xxx - Supprime un lien
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const linkId = searchParams.get('linkId')

  if (!linkId) {
    return NextResponse.json(
      { error: 'ID du lien requis' },
      { status: 400 }
    )
  }

  try {
    await prisma.lien.delete({
      where: { id: linkId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lien:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du lien' },
      { status: 500 }
    )
  }
}
