import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Pays } from '@prisma/client'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, name, pays } = body

        if (!email || !name || !pays) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Map short country code to enum if necessary (though the landing page seems to handle it)
        // In the landing page: 'FR', 'BE', 'CH', 'LU' -> Mapping to Pays enum
        const paysMap: Record<string, Pays> = {
            'FR': Pays.FRANCE,
            'BE': Pays.BELGIQUE,
            'CH': Pays.SUISSE,
            'LU': Pays.LUXEMBOURG,
            'FRANCE': Pays.FRANCE,
            'BELGIQUE': Pays.BELGIQUE,
            'SUISSE': Pays.SUISSE,
            'LUXEMBOURG': Pays.LUXEMBOURG
        }

        const paysEnum = paysMap[pays as string] || Pays.FRANCE

        // Create avocat
        const avocat = await prisma.avocat.create({
            data: {
                email,
                nom: name, // In schema it's 'nom', landing page sends 'name'
                prenom: 'Me', // Default or placeholder since landing page has one field
                pays: paysEnum,
                isActive: true
            }
        })

        return NextResponse.json({ success: true, avocat })
    } catch (error: any) {
        console.error('Registration API error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Server error during registration' }, { status: 500 })
    }
}
