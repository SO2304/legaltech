'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Scale, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.success) {
        sessionStorage.setItem('avocat', JSON.stringify(data.avocat))
        router.push('/dashboard')
      } else {
        setError(data.error || 'Email ou mot de passe incorrect')
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="w-7 h-7 text-gold" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-1">Espace Avocat</h1>
          <p className="text-white/40 text-sm">Connectez-vous pour gérer vos dossiers</p>
        </div>

        {/* Card */}
        <Card className="border-0 shadow-paper-xl">
          <CardHeader>
            <CardTitle className="font-serif text-navy">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-navy">Email</Label>
                <Input
                  type="email"
                  placeholder="avocat@cabinet.fr"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  className="border-pearl-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-navy">Mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                    className="border-pearl-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-navy hover:bg-navy/80"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Connexion...</>
                  : 'Se connecter'
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-6">
          Lexia · Conforme RGPD · Hébergement Europe
        </p>
      </div>
    </div>
  )
}
