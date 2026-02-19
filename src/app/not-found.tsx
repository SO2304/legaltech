'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Scale } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-pearl flex items-center justify-center p-6">
      <div className="text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
            <Scale className="w-6 h-6 text-gold" />
          </div>
        </div>

        {/* 404 */}
        <p className="font-mono text-6xl font-bold text-pearl-300 mb-4">404</p>
        
        <h1 className="font-serif text-2xl font-bold text-navy mb-2">
          Page introuvable
        </h1>
        <p className="text-navy/60 text-sm mb-8">
          La page que vous recherchez n'existe pas.
        </p>

        <Link href="/">
          <Button className="bg-navy hover:bg-navy/80">
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  )
}
