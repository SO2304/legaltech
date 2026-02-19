'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Scale, Home } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-pearl flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-paper-xl">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-gold" />
            </div>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          {/* Content */}
          <h1 className="font-serif text-xl font-bold text-navy mb-2">
            Une erreur est survenue
          </h1>
          <p className="text-navy/60 text-sm mb-6">
            Nous avons rencontré un problème inattendu. Veuillez réessayer.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-pearl-300 text-navy"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
            <Button
              variant="gold"
              onClick={reset}
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
