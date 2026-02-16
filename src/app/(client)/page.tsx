'use client'

// ============================================
// FLASHJURIS - LANDING PAGE MULTI-JURIDICTION
// France, Belgique, Suisse, Luxembourg
// Service gratuit pour les avocats
// ============================================

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  QrCode,
  Clock,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  FileText,
  Banknote,
  MapPin,
  Globe,
  Loader2,
  Scale,
  Brain
} from 'lucide-react'
import { COUNTRY_OPTIONS, PRICES, type CountryCode } from '@/lib/countries'
import { Pays } from '@prisma/client'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

export default function FlashJurisLanding() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState<CountryCode>('FR')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/geolocation')
      .then(r => r.json())
      .then(data => {
        // Map long enum PAYS to short COUNTRY_CODE
        const paysMap: Record<string, CountryCode> = {
          'FRANCE': 'FR',
          'BELGIQUE': 'BE',
          'SUISSE': 'CH',
          'LUXEMBOURG': 'LU'
        }
        setCountry(paysMap[data.pays] || 'FR')
        setLoading(false)
      })
      .catch(() => {
        setCountry('FR')
        setLoading(false)
      })
  }, [])

  const priceConfig = PRICES[country]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return

    setSubmitting(true)

    try {
      const res = await fetch('/api/avocats/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, pays: country }),
      })

      if (res.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden border-none">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code envoyé !</h1>
              <p className="text-gray-600 mb-4">Votre QR Code personnel vous a été envoyé à <strong>{email}</strong></p>
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <p className="text-green-800 font-medium text-sm">✅ Service 100% GRATUIT pour vous</p>
                <p className="text-green-600 text-xs mt-1">Vos clients paient et vous touchez 20% de commission</p>
              </div>
              <p className="text-sm text-gray-500">Imprimez le QR Code et posez-le sur votre bureau.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 italic-none">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl tracking-tight">FlashJuris</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
              <Globe className="w-4 h-4" />
              <span>FR • BE • CH • LU</span>
            </div>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-green-200">GRATUIT</span>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge pays */}
          <motion.div variants={itemVariants} className="mb-6">
            <Badge variant="outline" className="text-lg py-1 px-4 bg-white/50 backdrop-blur-sm border-slate-200">
              {COUNTRY_OPTIONS.find(c => c.code === country)?.flag} {COUNTRY_OPTIONS.find(c => c.code === country)?.name}
            </Badge>
          </motion.div>

          {/* Drapeaux */}
          <motion.div variants={itemVariants} className="flex justify-center gap-4 mb-8">
            {COUNTRY_OPTIONS.map((c) => (
              <motion.span
                key={c.code}
                whileHover={{ scale: 1.2, rotate: 5 }}
                className="text-4xl filter drop-shadow-md cursor-help"
                title={c.name}
              >
                {c.flag}
              </motion.span>
            ))}
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
            Recevez les documents de vos clients
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> en un seul scan</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl text-slate-600 mb-4">
            <strong className="text-slate-900">100% Gratuit pour les avocats.</strong> Vos clients paient des frais de dossier, vous percevez une commission.
          </motion.p>

          <motion.p variants={itemVariants} className="text-slate-400 text-sm mb-12 flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" />
            Conforme RGPD · France, Belgique, Suisse, Luxembourg
          </motion.p>

          {/* Registration Form */}
          <motion.div
            variants={itemVariants}
            className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />

            <div className="text-center mb-8">
              <span className="text-4xl font-bold text-slate-900">0€</span>
              <span className="text-slate-400 text-sm ml-2 block font-medium">À VIE POUR LES AVOCATS</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-3 block text-left">Juridiction d'exercice</label>
                <div className="grid grid-cols-4 gap-3">
                  {COUNTRY_OPTIONS.map((c) => (
                    <motion.button
                      key={c.code}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCountry(c.code as CountryCode)}
                      className={`p-3 rounded-2xl text-center transition-all ${country === c.code
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-600 ring-offset-2'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-400'
                        }`}
                    >
                      <span className="text-2xl">{c.flag}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Votre nom d'exercice (Me Dupont)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-500 transition-all text-base px-5"
                  required
                />
                <Input
                  type="email"
                  placeholder="Email professionnel"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-500 transition-all text-base px-5"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 transition-all group"
              >
                {submitting ? 'Préparation...' : (
                  <>
                    Générer mon QR Code
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-slate-400 mt-6 leading-relaxed">
              ✓ Génération instantanée<br />
              ✓ Sans abonnement, ni frais cachés
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Prices */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">Tarification transparente</h2>
            <p className="text-slate-500 text-lg">Seul le client final est facturé au moment de l'upload.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {COUNTRY_OPTIONS.map((c, i) => {
              const price = PRICES[c.code as CountryCode]
              const commission = Math.round(price.amount * 0.20)

              return (
                <motion.div
                  key={c.code}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center"
                >
                  <span className="text-5xl block mb-6">{c.flag}</span>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{c.name}</h3>
                  <div className="text-3xl font-extrabold text-blue-600 mb-4">{price.display}</div>
                  <div className="h-px bg-slate-200 w-full mb-4" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    VOTRE COM.
                  </p>
                  <p className="text-xl font-bold text-green-600 mt-1">
                    + {(commission / 100).toFixed(2)} {price.currency}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-20 tracking-tight">Le parcours client</h2>

          <div className="grid md:grid-cols-4 gap-12">
            {[
              { icon: QrCode, title: 'QR Code unique', desc: 'Votre client scanne le code sur votre bureau ou site', color: 'blue' },
              { icon: FileText, title: 'Upload sécurisé', desc: 'Il dépose les pièces demandées par l\'IA', color: 'indigo' },
              { icon: Zap, title: 'Traitement instantané', desc: 'L\'IA analyse et pré-classe tout pour vous', color: 'purple' },
              { icon: CheckCircle, title: 'ZIP Complet', desc: 'Vous recevez le dossier prêt à être traité', color: 'green' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 -right-6 text-slate-200">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
                <div className={`w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200`}>
                  <item.icon className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed px-4">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Cards */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-100 rounded-full -ml-32 -mt-32 blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-100 rounded-full -mr-32 -mb-32 blur-3xl opacity-30" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <Clock className="w-12 h-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-4">Récupération Flash</h3>
              <p className="text-slate-500 leading-relaxed">Fini les relances. Les clients déposent tout en une fois, le dossier vous arrive complet.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-3xl bg-slate-900 text-white shadow-2xl">
              <Shield className="w-12 h-12 text-blue-400 mb-6" />
              <h3 className="text-xl font-bold mb-4">RGPD & LPD Native</h3>
              <p className="text-slate-400 leading-relaxed">Conforme aux normes européennes et suisses. Suppression automatique des données après 7 jours.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <Lock className="w-12 h-12 text-indigo-600 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-4">Secret Professionnel</h3>
              <p className="text-slate-500 leading-relaxed">Chiffrement de bout en bout. Seul l\'avocat peut accéder aux documents déposés.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Zap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-xl tracking-tight">FlashJuris</span>
          </div>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            Service professionnel d'aide à la collecte documentaire pour les cabinets d'avocats. Dispo en FR, BE, CH, LU.
          </p>
          <div className="text-slate-300 text-xs font-medium tracking-widest uppercase">
            © 2026 FLASHJURIS · LEGALTECH PLATFORM
          </div>
        </div>
      </footer>
    </div>
  )
}
