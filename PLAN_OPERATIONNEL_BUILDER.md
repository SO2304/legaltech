# 🎯 PLAN OPÉRATIONNEL BUILDER IA - Projet Divorce Multi-juridictions

**Objectif** : Rendre le projet **100% opérationnel et fonctionnel**  
**Point de départ** : Infrastructure + Services backend en place (60-70%)  
**Point d'arrivée** : Application complète déployée en production

---

## 📊 ÉTAT ACTUEL (Après migration)

### ✅ Ce qui est fait (60-70%)
```
✓ Schéma Prisma (5 tables + 4 enums)
✓ Dépendances installées (Anthropic, Stripe, Supabase)
✓ Services backend (rag, ocr, geo, stripe, purge)
✓ Structure projet (lib/, (client)/, (avocat)/)
✓ Configuration (.env.example, render.yaml)
```

### ❌ Ce qui manque (30-40%)
```
❌ Routes API (8 routes)
❌ Pages frontend (6 pages)
❌ Composants UI (8 composants)
❌ Logique métier (analyse IA, upload, paiement)
❌ Base de données opérationnelle
❌ Déploiement production
```

---

## 🚀 PLAN EN 10 SESSIONS BUILDER IA

### SESSION 1 : API Géolocalisation (30 min)
### SESSION 2 : Landing Page avec détection pays (45 min)
### SESSION 3 : API Upload + OCR (1h30)
### SESSION 4 : Page Upload Documents (1h)
### SESSION 5 : API Paiement Stripe (1h)
### SESSION 6 : Page Paiement (1h)
### SESSION 7 : Webhook Stripe + Analyse IA (1h30)
### SESSION 8 : Dashboard Avocat - Liste (1h)
### SESSION 9 : Dashboard Avocat - Split-view (2h)
### SESSION 10 : Cron Purge + Tests (1h)

**DURÉE TOTALE** : 10-12h

---

## 📋 SESSION 1 : API GÉOLOCALISATION (30 min)

### Prompt pour Builder IA

```
CONTEXTE:
Projet divorce multi-juridictions. Infrastructure en place.
Dépôt: https://github.com/SO2304/legaltech
Branche: divorce-platform-migration (ou main si mergé)

OBJECTIF SESSION 1:
Créer l'API de géolocalisation pour détecter le pays du client via IP.

FICHIER À CRÉER: src/app/api/geolocation/route.ts

CODE EXACT:

import { NextRequest, NextResponse } from 'next/server'
import { detecterPaysClient, getClientIP } from '@/lib/geolocation-service'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const result = await detecterPaysClient(ip)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Géolocalisation error:', error)
    return NextResponse.json(
      { error: 'Géolocalisation échouée' },
      { status: 500 }
    )
  }
}

TEST LOCAL:
1. npm run dev
2. Ouvrir: http://localhost:3000/api/geolocation
3. Doit retourner JSON avec pays détecté

VÉRIFICATION:
- Route /api/geolocation accessible
- Retourne JSON: { pays, paysDetecte, confiance, isVPN, ipAddress }
- Pas d'erreur console
```

**Résultat attendu** :
- ✅ API `/api/geolocation` opérationnelle
- ✅ Retourne pays détecté en JSON

---

## 📋 SESSION 2 : LANDING PAGE (45 min)

### Prompt pour Builder IA

```
CONTEXTE:
Suite SESSION 1 - API géolocalisation opérationnelle.

OBJECTIF SESSION 2:
Créer la page d'accueil avec détection automatique du pays.

FICHIER À CRÉER: src/app/(client)/page.tsx

CODE:

'use client'

import { useEffect, useState } from 'react'
import { Pays } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Loader2, Scale, Brain, Shield, Clock } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [pays, setPays] = useState<Pays | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/geolocation')
      .then(r => r.json())
      .then(data => {
        setPays(data.pays)
        setLoading(false)
      })
      .catch(() => {
        setPays(Pays.FRANCE)
        setLoading(false)
      })
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  const countryInfo: Record<Pays, { emoji: string; nom: string }> = {
    [Pays.FRANCE]: { emoji: '🇫🇷', nom: 'France' },
    [Pays.BELGIQUE]: { emoji: '🇧🇪', nom: 'Belgique' },
    [Pays.SUISSE]: { emoji: '🇨🇭', nom: 'Suisse' },
    [Pays.LUXEMBOURG]: { emoji: '🇱🇺', nom: 'Luxembourg' }
  }
  
  const info = countryInfo[pays!]
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl">Divorce Platform</span>
          </div>
          <Button variant="outline">Espace avocat</Button>
        </div>
      </header>
      
      {/* Hero */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge pays */}
          <Badge variant="outline" className="text-lg py-2 px-4">
            {info.emoji} {info.nom}
          </Badge>
          
          <h1 className="text-5xl font-bold tracking-tight">
            Analyse automatisée de votre dossier de divorce
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Propulsé par l'intelligence artificielle, basé exclusivement 
            sur les textes de lois officiels de votre pays
          </p>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <Card className="p-6 text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Analyse IA</h3>
              <p className="text-sm text-muted-foreground">
                Extraction automatique avec Claude Vision OCR
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Scale className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Base légale stricte</h3>
              <p className="text-sm text-muted-foreground">
                Citations exclusives des codes civils officiels
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">RGPD Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Purge automatique des données après 7 jours
              </p>
            </Card>
          </div>
          
          {/* CTA */}
          <div className="pt-8 space-y-4">
            <Button 
              size="lg" 
              className="text-lg px-8 h-12"
              onClick={() => router.push('/intake/nouveau')}
            >
              Commencer mon dossier →
            </Button>
            
            <p className="text-sm text-muted-foreground">
              149€ TTC · Analyse complète · Paiement sécurisé Stripe
            </p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Divorce Platform · Conformité RGPD · Données hébergées en Europe</p>
        </div>
      </footer>
    </div>
  )
}

TEST:
1. Ouvrir http://localhost:3000
2. Vérifier badge pays affiché
3. Vérifier 3 cards features
4. Vérifier bouton CTA

VÉRIFICATION:
- Badge pays s'affiche avec emoji
- Design épuré style Fintech
- Bouton "Commencer mon dossier" présent
- Pas d'erreur console
```

**Résultat attendu** :
- ✅ Landing page fonctionnelle
- ✅ Détection pays affichée
- ✅ Design professionnel

---

## 📋 SESSION 3 : API UPLOAD + OCR (1h30)

### Prompt pour Builder IA

```
CONTEXTE:
Suite SESSION 2 - Landing page opérationnelle.

OBJECTIF SESSION 3:
Créer l'API d'upload de documents avec OCR automatique.

PRÉREQUIS:
- Clés API dans .env.local:
  * ANTHROPIC_API_KEY
  * SUPABASE_URL
  * SUPABASE_ANON_KEY
  * SUPABASE_SERVICE_KEY

FICHIER À CRÉER: src/app/api/upload/route.ts

CODE:

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extraireDocumentOCR } from '@/lib/ocr-service'
import { validerDocumentRAG } from '@/lib/rag-service'
import { prisma } from '@/lib/prisma'
import { DocumentType, Pays } from '@prisma/client'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dossierId = formData.get('dossierId') as string
    const type = formData.get('type') as DocumentType
    const pays = formData.get('pays') as Pays
    
    if (!file || !dossierId || !type) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }
    
    // 1. Upload vers Supabase Storage
    const filename = `${dossierId}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filename, file)
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erreur upload' },
        { status: 500 }
      )
    }
    
    // 2. Obtenir URL publique temporaire
    const { data: urlData } = supabase.storage
      .from('documents')
      .createSignedUrl(filename, 3600)
    
    // 3. OCR + Extraction (avec chemin fichier)
    const ocrResult = await extraireDocumentOCR(
      uploadData.path,
      type,
      pays
    )
    
    // 4. Validation RAG
    const validation = await validerDocumentRAG(
      pays,
      type,
      ocrResult.texteExtrait
    )
    
    // 5. Enregistrer en DB
    const document = await prisma.document.create({
      data: {
        dossierId,
        type,
        nomOriginal: file.name,
        nomStockage: filename,
        mimeType: file.type,
        taille: file.size,
        cheminStorage: uploadData.path,
        texteExtrait: ocrResult.texteExtrait,
        donneesExtraites: JSON.stringify(ocrResult.donneesExtraites),
        qualiteImage: ocrResult.qualiteImage,
        exigeLegal: validation.estExige,
        articleLoi: validation.articleLoi,
        estValide: validation.alertes.length === 0,
        datePurge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // J+7
      }
    })
    
    return NextResponse.json({
      success: true,
      document,
      ocr: ocrResult,
      validation
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

CONFIGURATION SUPABASE REQUISE:
1. Créer projet Supabase
2. Storage > New Bucket "documents"
3. Politique: Privé (non public)

TEST:
- Utiliser Postman ou curl pour tester upload
- Vérifier document créé en DB
- Vérifier OCR extrait données

VÉRIFICATION:
- Upload fonctionne
- Document stocké dans Supabase
- OCR extrait texte
- Document enregistré en DB
```

**Résultat attendu** :
- ✅ API `/api/upload` opérationnelle
- ✅ Upload vers Supabase fonctionne
- ✅ OCR extrait données
- ✅ Document en DB

---

## 📋 SESSION 4 : PAGE UPLOAD (1h)

### Prompt pour Builder IA

```
CONTEXTE:
Suite SESSION 3 - API upload opérationnelle.

OBJECTIF SESSION 4:
Créer la page d'upload de documents avec drag & drop.

FICHIER À CRÉER: src/app/(client)/intake/[dossierId]/page.tsx

CODE:

'use client'

import { useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { DocumentType, Pays } from '@prisma/client'

interface UploadedDoc {
  id: string
  name: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  ocr?: any
  validation?: any
}

export default function IntakePage() {
  const params = useParams()
  const router = useRouter()
  const dossierId = params.dossierId as string
  
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [pays] = useState<Pays>(Pays.FRANCE) // TODO: récupérer du contexte
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const tempId = Math.random().toString(36)
      
      // Ajouter à la liste
      setDocuments(prev => [...prev, {
        id: tempId,
        name: file.name,
        status: 'uploading',
        progress: 0
      }])
      
      // Upload
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('dossierId', dossierId)
        formData.append('type', DocumentType.AUTRE) // TODO: détecter type
        formData.append('pays', pays)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (response.ok) {
          setDocuments(prev => prev.map(d => 
            d.id === tempId 
              ? { ...d, status: 'success', progress: 100, ocr: result.ocr, validation: result.validation }
              : d
          ))
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        setDocuments(prev => prev.map(d => 
          d.id === tempId 
            ? { ...d, status: 'error', progress: 0 }
            : d
        ))
      }
    }
  }, [dossierId, pays])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  })
  
  const allUploaded = documents.length > 0 && documents.every(d => d.status === 'success')
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload de vos documents</h1>
        <p className="text-muted-foreground">
          Glissez vos documents ou cliquez pour les sélectionner
        </p>
      </div>
      
      {/* Zone dropzone */}
      <Card 
        {...getRootProps()} 
        className={`p-12 border-2 border-dashed text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg mb-2">
          {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez vos documents ici'}
        </p>
        <p className="text-sm text-muted-foreground">
          PDF, JPG, PNG · Max 10 MB
        </p>
      </Card>
      
      {/* Liste documents */}
      {documents.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Documents uploadés</h2>
          
          {documents.map(doc => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center gap-4">
                <FileText className="w-10 h-10 text-gray-400" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{doc.name}</span>
                    {doc.status === 'success' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Validé
                      </Badge>
                    )}
                    {doc.status === 'error' && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Erreur
                      </Badge>
                    )}
                  </div>
                  
                  {doc.status === 'uploading' && (
                    <Progress value={doc.progress} className="h-2" />
                  )}
                  
                  {doc.validation?.estExige && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ⚖️ {doc.validation.articleLoi}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* CTA */}
      {allUploaded && (
        <div className="mt-8 flex justify-end">
          <Button 
            size="lg"
            onClick={() => router.push(`/payment?dossierId=${dossierId}`)}
          >
            Continuer vers le paiement →
          </Button>
        </div>
      )}
    </div>
  )
}

TEST:
1. Créer dossier test (en DB ou hardcoder ID)
2. Ouvrir /intake/test-id
3. Glisser fichier PDF ou image
4. Vérifier upload + OCR

VÉRIFICATION:
- Dropzone fonctionne
- Upload progresse
- Documents affichés avec status
- Badge "Validé" si exigeLegal
- Bouton paiement apparaît
```

**Résultat attendu** :
- ✅ Page upload fonctionnelle
- ✅ Drag & drop opérationnel
- ✅ Upload + OCR automatique
- ✅ Liste documents avec statuts

---

## 📋 SESSIONS 5-10 : RÉSUMÉ

### SESSION 5 : API Paiement (1h)
- Créer `/api/payment/create/route.ts`
- Intégration Stripe Payment Intent
- Montant 149€ TTC

### SESSION 6 : Page Paiement (1h)
- Créer `(client)/payment/page.tsx`
- Stripe Elements
- Confirmation post-paiement

### SESSION 7 : Webhook + Analyse IA (1h30)
- Créer `/api/webhook/stripe/route.ts`
- Créer `/api/analyse/dossier/route.ts`
- Trigger analyse après paiement

### SESSION 8 : Dashboard Liste (1h)
- Créer `(avocat)/dashboard/page.tsx`
- Liste dossiers payés
- Filtres et recherche

### SESSION 9 : Dashboard Split-view (2h)
- Créer `(avocat)/dashboard/[id]/page.tsx`
- Layout split (synthèse | documents)
- Source-mapping

### SESSION 10 : Cron Purge (1h)
- Créer `/api/cron/purge/route.ts`
- Logique purge J+7
- Configuration Render cron

---

## ✅ CHECKLIST PROGRESSION

### Infrastructure (✅ Fait)
- [x] Schéma Prisma
- [x] Dépendances
- [x] Services backend
- [x] Structure projet

### Backend API (En cours)
- [ ] SESSION 1: API Géolocalisation
- [ ] SESSION 3: API Upload
- [ ] SESSION 5: API Paiement
- [ ] SESSION 7: Webhook + Analyse
- [ ] SESSION 10: Cron Purge

### Frontend (En cours)
- [ ] SESSION 2: Landing page
- [ ] SESSION 4: Upload documents
- [ ] SESSION 6: Paiement
- [ ] SESSION 8: Dashboard liste
- [ ] SESSION 9: Dashboard split-view

### Déploiement
- [ ] Base de données (PostgreSQL)
- [ ] Supabase Storage configuré
- [ ] Variables env production
- [ ] Deploy sur Render
- [ ] Cron job configuré

---

## 🎯 RECOMMANDATION

### **Commencez par SESSION 1-2**

Ces 2 sessions sont **rapides** (1h15 total) et donnent un **résultat visible** :
- Landing page fonctionnelle
- Détection pays opérationnelle

**Puis continuez SESSION 3-4** pour avoir l'upload complet.

**Durée pour MVP fonctionnel** : Sessions 1-7 = 8-9h

---

**Prêt à commencer avec SESSION 1 ?** 🚀
