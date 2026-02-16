# 🏗️ PLAN DE DÉVELOPPEMENT SÉQUENTIEL - SaaS LegalTech Divorce
## Pour Builder IA (Bolt, Lovable, Cursor)

---

## 📋 CONTEXTE DU PROJET

**Dépôt existant** : https://github.com/SO2304/legaltech  
**Objectif** : Transformer le code actuel en plateforme d'analyse automatisée de dossiers de divorce  
**Contrainte** : Modifier le dépôt existant (pas de renommage massif)

### Vision du produit
- 🌍 Multi-pays (FR, BE, CH, LU) avec détection IP automatique
- ⚖️ RAG strict (textes de lois officiels uniquement)
- 📤 Smart intake (PDF, Word, Images + OCR Claude Vision)
- 🔗 Smart sourcing (liens portails gouvernementaux)
- 💻 Dashboard avocat split-view avec source-mapping
- 💳 Paywall Stripe 149€ TTC (dont 30€ marge cabinet)
- 🔐 Purge RGPD automatique J+7

---

## 🎯 PLAN EN 5 PHASES

---

# PHASE 1 : FONDATIONS & INFRASTRUCTURE RAG
**Durée estimée** : Builder IA - 1-2 sessions intensives

## 1.1 Architecture de Données (Schema Prisma)

### Tables à créer/modifier

```prisma
// ============================================
// TABLE 1 : Avocat (adapter table existante)
// ============================================
model Avocat {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  nom             String
  prenom          String
  cabinet         String?
  
  // NOUVEAU : Multi-juridiction
  pays            Pays     @default(FRANCE)
  barreau         String?
  numeroInscription String?
  
  // NOUVEAU : Stripe Connect
  stripeAccountId String?  @unique
  stripeOnboarded Boolean  @default(false)
  
  // Relations
  dossiers        Dossier[]
  
  @@index([email])
  @@index([pays])
  @@map("avocats")
}

// ============================================
// TABLE 2 : Client (NOUVELLE)
// ============================================
model Client {
  id              String   @id @default(cuid())
  email           String
  nom             String
  prenom          String
  telephone       String?
  
  // Détection géographique
  pays            Pays     @default(FRANCE)
  paysDetecte     Pays?    // Auto-détecté via IP
  ipAddress       String?
  
  createdAt       DateTime @default(now())
  
  dossiers        Dossier[]
  
  @@index([email])
  @@index([pays])
  @@map("clients")
}

// ============================================
// TABLE 3 : Dossier (REFONTE COMPLÈTE)
// ============================================
model Dossier {
  id                    String          @id @default(cuid())
  reference             String          @unique @default(cuid())
  
  // Relations
  avocatId              String
  avocat                Avocat          @relation(fields: [avocatId], references: [id])
  clientId              String
  client                Client          @relation(fields: [clientId], references: [id])
  
  // Statut workflow
  statut                DossierStatus   @default(BROUILLON)
  
  // Juridiction
  pays                  Pays            @default(FRANCE)
  
  // Données divorce
  typeProcedure         String?
  dateMariage           DateTime?
  nombreEnfants         Int             @default(0)
  
  // Analyse IA RAG
  analyseIA             String?         @db.Text
  syntheseHTML          String?         @db.Text
  sourcesLegales        String?         @db.Text  // JSON array
  
  // Paiement Stripe
  montantTTC            Float           @default(149.00)
  fraisGestion          Float           @default(30.00)
  stripePaymentIntent   String?         @unique
  stripePaid            Boolean         @default(false)
  stripePaidAt          DateTime?
  
  // Purge RGPD
  datePurge             DateTime?       // J+7 après validation
  isPurged              Boolean         @default(false)
  purgedAt              DateTime?
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  
  documents             Document[]
  
  @@index([avocatId])
  @@index([statut])
  @@index([pays])
  @@index([stripePaid])
  @@map("dossiers")
}

// ============================================
// TABLE 4 : Document (NOUVELLE)
// ============================================
model Document {
  id                    String          @id @default(cuid())
  dossierId             String
  dossier               Dossier         @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  
  // Fichier
  type                  DocumentType
  nomOriginal           String
  nomStockage           String          @unique
  mimeType              String
  taille                Int
  cheminStorage         String          // Supabase Storage path
  
  // OCR & Extraction IA
  texteExtrait          String?         @db.Text
  donneesExtraites      String?         @db.Text  // JSON
  qualiteImage          String?         // BONNE/FLOUE/ILLISIBLE
  
  // Validation RAG
  exigeLegal            Boolean         @default(false)
  articleLoi            String?         // "Art. 229 Code Civil FR"
  estValide             Boolean         @default(false)
  
  // Purge
  datePurge             DateTime
  isPurged              Boolean         @default(false)
  
  createdAt             DateTime        @default(now())
  
  @@index([dossierId])
  @@index([type])
  @@map("documents")
}

// ============================================
// TABLE 5 : TexteLoi (BASE RAG - CRITIQUE)
// ============================================
model TexteLoi {
  id                    String          @id @default(cuid())
  
  // Identification
  pays                  Pays
  code                  CodeLegal       // CODE_CIVIL, CODE_PROCEDURE
  article               String          // "229", "1387"
  titre                 String
  contenu               String          @db.Text
  
  // Embedding pour recherche sémantique (optionnel Phase 1)
  embedding             String?         @db.Text
  
  // Métadonnées
  dateVigueur           DateTime?
  estActif              Boolean         @default(true)
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  
  @@unique([pays, code, article])
  @@index([pays, code])
  @@index([estActif])
  @@map("textes_lois")
}

// ============================================
// ENUMS
// ============================================
enum Pays {
  FRANCE
  BELGIQUE
  SUISSE
  LUXEMBOURG
}

enum DossierStatus {
  BROUILLON
  EN_ATTENTE_PAIEMENT
  PAYE
  EN_ANALYSE
  ANALYSE_TERMINEE
  VALIDE
  PURGE
}

enum DocumentType {
  CARTE_IDENTITE
  ACTE_MARIAGE
  BULLETIN_SALAIRE
  AVIS_IMPOSITION
  RELEVE_BANCAIRE
  TITRE_PROPRIETE
  AUTRE
}

enum CodeLegal {
  CODE_CIVIL
  CODE_PROCEDURE_CIVILE
  CODE_FAMILLE
}
```

---

## 1.2 Logique Backend

### API Routes à créer

#### `/api/geolocation/route.ts` - Détection pays
```typescript
export async function GET(request: Request) {
  // 1. Extraire IP
  const ip = request.headers.get('x-forwarded-for') || '0.0.0.0'
  
  // 2. Appeler ipapi.co
  const response = await fetch(`https://ipapi.co/${ip}/json/`)
  const data = await response.json()
  
  // 3. Mapper code pays → enum Pays
  const pays = mapCountryToPays(data.country_code)
  
  // 4. Détecter VPN
  const isVPN = data.org?.includes('vpn') || data.org?.includes('proxy')
  
  return NextResponse.json({
    pays,
    paysDetecte: pays,
    confiance: isVPN ? 0.3 : 0.9,
    isVPN
  })
}
```

#### `/api/rag/query/route.ts` - Interrogation RAG
```typescript
export async function POST(request: Request) {
  const { pays, question } = await request.json()
  
  // 1. Récupérer textes de lois pertinents
  const lois = await prisma.texteLoi.findMany({
    where: {
      pays,
      estActif: true,
      // Recherche par mots-clés (Phase 1 simple)
      contenu: { contains: extractKeywords(question) }
    },
    take: 5
  })
  
  // 2. Construire contexte strict
  const contexte = lois.map(l => 
    `[${l.pays} - ${l.code} - Art. ${l.article}]\n${l.contenu}`
  ).join('\n\n---\n\n')
  
  // 3. Appel Claude avec système prompt RAG
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    system: `Tu NE DOIS répondre QU'à partir des textes de lois fournis.
Si un article n'exige PAS explicitement une pièce, NE LA DEMANDE PAS.
CITE TOUJOURS l'article exact.
INTERDICTION d'utiliser ta culture générale.`,
    messages: [{
      role: 'user',
      content: `CONTEXTE LÉGAL:\n${contexte}\n\nQUESTION:\n${question}`
    }]
  })
  
  return NextResponse.json({
    reponse: response.content[0].text,
    sources: lois.map(l => ({
      article: `Art. ${l.article} ${l.code}`,
      extrait: l.titre
    }))
  })
}
```

### Supabase Edge Functions (optionnel)
Pour Phase 1, utiliser Next.js API Routes suffit.

---

## 1.3 Interface Frontend (UI/UX)

### Composants clés Phase 1

#### 1. Landing Page avec détection pays
**Fichier** : `src/app/(public)/page.tsx`

**UI** :
```
┌────────────────────────────────────────┐
│  🌍 [FR] France détecté  [Modifier]   │
├────────────────────────────────────────┤
│                                        │
│   Analyse automatisée de votre        │
│   dossier de divorce                   │
│                                        │
│   Propulsé par l'IA                    │
│   Basé sur les textes de lois          │
│                                        │
│   [Commencer mon dossier] →           │
│                                        │
└────────────────────────────────────────┘
```

#### 2. Sélecteur pays (si VPN détecté)
**Composant** : `src/components/CountrySelector.tsx`

```tsx
<Select>
  <SelectTrigger>
    <Flag country={pays} /> {pays}
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="FRANCE">🇫🇷 France</SelectItem>
    <SelectItem value="BELGIQUE">🇧🇪 Belgique</SelectItem>
    <SelectItem value="SUISSE">🇨🇭 Suisse</SelectItem>
    <SelectItem value="LUXEMBOURG">🇱🇺 Luxembourg</SelectItem>
  </SelectContent>
</Select>
```

---

## 1.4 Instructions Prompting pour Builder IA

### 🎯 Prompt Phase 1 - Session 1 : Schema & Base RAG

```
CONTEXTE:
Je développe une application LegalTech de gestion de dossiers de divorce multi-pays.
Repository GitHub existant à modifier (pas de renommage).

TÂCHE PHASE 1:
Implémente la base de données et le système RAG (Retrieval-Augmented Generation).

ACTIONS PRÉCISES:

1. SCHEMA PRISMA:
   - Modifie prisma/schema.prisma
   - Ajoute les 5 tables: Avocat (adapter existant), Client, Dossier, Document, TexteLoi
   - Respecte EXACTEMENT les types et relations fournis
   - Ajoute les enums: Pays, DossierStatus, DocumentType, CodeLegal
   - Important: datasource = postgresql (pas SQLite)

2. MIGRATION:
   - Génère la migration Prisma
   - Nom: "init-legaltech-rag"

3. SEED TEXTES DE LOIS:
   - Crée prisma/seed.ts
   - Ajoute au minimum 10 articles de loi français:
     * Code Civil Art. 229 (cas de divorce)
     * Code Civil Art. 230 (divorce accepté)
     * Code Civil Art. 1387 (régime matrimonial)
     * Etc.
   - Format: { pays: 'FRANCE', code: 'CODE_CIVIL', article: '229', titre: '...', contenu: '...' }

4. SERVICE RAG:
   - Crée src/lib/rag-service.ts
   - Fonction queryRAG(pays, question) qui:
     a) Récupère textes de lois pertinents via Prisma
     b) Construit contexte strict
     c) Appelle Anthropic Claude avec système prompt RAG
     d) Retourne réponse + sources
   
   SYSTÈME PROMPT CRITIQUE:
   "Tu NE DOIS répondre QU'à partir des textes de lois fournis.
   Si un article n'exige PAS explicitement une pièce, NE LA DEMANDE PAS.
   CITE TOUJOURS l'article exact.
   INTERDICTION d'utiliser ta culture générale."

5. API ROUTE RAG:
   - Crée src/app/api/rag/query/route.ts
   - POST endpoint qui appelle queryRAG()

CONTRAINTES:
- TypeScript strict
- Gestion erreurs complète
- Logs détaillés pour debug RAG
- Commentaires explicatifs

VÉRIFICATION:
Après implémentation, teste:
- prisma generate
- prisma migrate dev
- npx tsx prisma/seed.ts
- Vérifier via Prisma Studio que textes de lois sont bien en DB
```

### 🎯 Prompt Phase 1 - Session 2 : Géolocalisation

```
TÂCHE PHASE 1 (suite):
Implémente la détection automatique du pays via IP.

ACTIONS:

1. SERVICE GÉOLOCALISATION:
   - Crée src/lib/geolocation-service.ts
   - Fonction detecterPaysClient(ip):
     a) Appelle https://ipapi.co/{ip}/json/
     b) Mappe country_code vers enum Pays
     c) Détecte VPN (org contains 'vpn' ou 'proxy')
     d) Calcule confiance (0-1)
   - Fonction getClientIP(request) qui extrait IP depuis headers

2. API ROUTE GÉOLOCALISATION:
   - Crée src/app/api/geolocation/route.ts
   - GET endpoint qui:
     a) Récupère IP du client
     b) Appelle detecterPaysClient()
     c) Retourne { pays, paysDetecte, confiance, isVPN }

3. COMPOSANT LANDING:
   - Modifie src/app/(public)/page.tsx (ou page racine)
   - Au mount, fetch('/api/geolocation')
   - Affiche pays détecté avec drapeau emoji
   - Si isVPN ou confiance < 0.5: Affiche CountrySelector
   - Sinon: Badge info "🌍 [FR] France détecté"

4. COMPOSANT COUNTRY SELECTOR:
   - Crée src/components/CountrySelector.tsx
   - Select shadcn/ui avec 4 options (FR, BE, CH, LU)
   - Avec drapeaux emoji
   - onChange stocke dans state/context

TESTS:
- Vérifier détection automatique
- Tester changement manuel
- Vérifier fallback si API ipapi fail (France par défaut)
```

---

## 1.5 Structure Base de Connaissances RAG

### Comment éviter les hallucinations ?

#### A. Seeding initial rigoureux

**Fichier** : `prisma/seed-lois-france.ts`

```typescript
const loisFrance = [
  {
    pays: 'FRANCE',
    code: 'CODE_CIVIL',
    article: '229',
    titre: 'Cas de divorce',
    contenu: `Le divorce peut être prononcé en cas :
1° De consentement mutuel ;
2° D'acceptation du principe de la rupture du mariage ;
3° D'altération définitive du lien conjugal ;
4° De faute.`,
    dateVigueur: new Date('2005-01-01')
  },
  {
    pays: 'FRANCE',
    code: 'CODE_CIVIL',
    article: '1387',
    titre: 'Régime de la communauté réduite aux acquêts',
    contenu: `La communauté se compose activement des acquêts faits par les époux ensemble ou séparément durant le mariage, et provenant tant de leur industrie personnelle que des économies faites sur les fruits et revenus de leurs biens propres.`,
    dateVigueur: new Date('1966-01-01')
  },
  // ... AU MINIMUM 30-50 articles par pays
]
```

#### B. Système Prompt implacable

```typescript
const SYSTEM_PROMPT = `Tu es un assistant juridique STRICTEMENT basé sur les textes de lois.

RÈGLES ABSOLUES (NON-NÉGOCIABLES):

1. SOURCE UNIQUE: Tu NE PEUX répondre QU'à partir des articles de loi fournis dans le contexte.

2. PAS D'EXIGENCE NON-LÉGALE: Si un article n'exige PAS explicitement une pièce, tu NE LA DEMANDES PAS.
   Exemple INTERDIT: "Il est généralement recommandé de fournir..."
   Exemple AUTORISÉ: "Selon l'Art. 229 du Code Civil, l'acte de mariage est exigé."

3. CITATION OBLIGATOIRE: Chaque affirmation doit citer l'article exact.
   Format: "Art. [NUMÉRO] [CODE] [PAYS]"

4. INCERTITUDE ASSUMÉE: Si l'information n'est PAS dans le contexte, réponds:
   "Cette information n'est pas présente dans les textes de lois fournis."

5. INTERDICTION CULTURE GÉNÉRALE: Tu N'UTILISES PAS ta connaissance pré-entraînée.

FORMAT RÉPONSE JSON STRICT:
{
  "reponse": "...",
  "sources": [
    {
      "pays": "FRANCE",
      "code": "CODE_CIVIL",
      "article": "229",
      "extrait": "Le divorce peut être prononcé..."
    }
  ],
  "confiance": 0.95,
  "alertes": ["Aucune information sur X dans les textes fournis"]
}
`
```

#### C. Validation post-génération

```typescript
async function validerReponseRAG(reponse: any) {
  // 1. Vérifier que sources existe et n'est pas vide
  if (!reponse.sources || reponse.sources.length === 0) {
    throw new Error('RAG: Réponse sans source = hallucination probable')
  }
  
  // 2. Vérifier que chaque source cite un vrai article
  for (const source of reponse.sources) {
    const existe = await prisma.texteLoi.findUnique({
      where: {
        pays_code_article: {
          pays: source.pays,
          code: source.code,
          article: source.article
        }
      }
    })
    
    if (!existe) {
      throw new Error(`Article inexistant cité: ${source.article}`)
    }
  }
  
  // 3. OK
  return true
}
```

---

## 1.6 Checklist Phase 1

- [ ] Schema Prisma créé avec 5 tables
- [ ] Enums ajoutés (Pays, DossierStatus, etc.)
- [ ] Migration générée et appliquée
- [ ] Seed avec minimum 10 textes de lois FR
- [ ] Service RAG créé (rag-service.ts)
- [ ] API /api/rag/query fonctionnelle
- [ ] Service géolocalisation créé
- [ ] API /api/geolocation fonctionnelle
- [ ] Landing page avec détection pays
- [ ] CountrySelector si VPN détecté
- [ ] Tests RAG: Questions → Réponses avec sources
- [ ] Validation: Aucune hallucination détectée

---

# PHASE 2 : SMART INTAKE CLIENT & OCR
**Durée estimée** : Builder IA - 2-3 sessions

## 2.1 Architecture de Données

### Ajouts au Schema Prisma (déjà créé en Phase 1)

Aucune modification majeure, utiliser tables existantes :
- `Document` : Pour stocker fichiers uploadés
- `Dossier` : Pour lier documents au dossier client

---

## 2.2 Logique Backend

### API Routes à créer

#### `/api/upload/route.ts` - Upload + OCR

```typescript
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const dossierId = formData.get('dossierId') as string
  const type = formData.get('type') as DocumentType
  
  // 1. Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(`${dossierId}/${Date.now()}_${file.name}`, file)
  
  if (error) throw error
  
  // 2. OCR avec Claude Vision (si image/PDF scanné)
  const ocrResult = await extraireDocumentOCR(
    data.path,
    type,
    pays
  )
  
  // 3. Validation RAG
  const validation = await validerDocumentRAG(
    pays,
    type,
    ocrResult.texteExtrait
  )
  
  // 4. Enregistrer en DB
  const document = await prisma.document.create({
    data: {
      dossierId,
      type,
      nomOriginal: file.name,
      nomStockage: data.path,
      mimeType: file.type,
      taille: file.size,
      cheminStorage: data.path,
      texteExtrait: ocrResult.texteExtrait,
      donneesExtraites: JSON.stringify(ocrResult.donneesExtraites),
      qualiteImage: ocrResult.qualiteImage,
      exigeLegal: validation.estExige,
      articleLoi: validation.articleLoi,
      estValide: validation.alertes.length === 0,
      datePurge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })
  
  return NextResponse.json({
    document,
    ocr: ocrResult,
    validation
  })
}
```

#### Service OCR : `src/lib/ocr-service.ts`

```typescript
export async function extraireDocumentOCR(
  filePath: string,
  type: DocumentType,
  pays: Pays
): Promise<OCRResult> {
  // 1. Lire fichier depuis Supabase Storage
  const { data } = await supabase.storage
    .from('documents')
    .download(filePath)
  
  const buffer = await data.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  
  // 2. Construire prompt spécifique au type
  const prompt = buildOCRPrompt(type, pays)
  
  // 3. Appel Claude Vision
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64
          }
        },
        {
          type: 'text',
          text: prompt
        }
      ]
    }]
  })
  
  // 4. Parser réponse JSON
  const result = JSON.parse(response.content[0].text)
  
  return {
    texteExtrait: result.texte_complet,
    donneesExtraites: result.donnees,
    qualiteImage: result.qualite,
    confiance: result.confiance,
    alertes: result.alertes
  }
}

function buildOCRPrompt(type: DocumentType, pays: Pays): string {
  const prompts = {
    CARTE_IDENTITE: `Extrais les données structurées de cette carte d'identité.
Format JSON:
{
  "type_detecte": "CARTE_IDENTITE",
  "qualite": "BONNE|FLOUE|ILLISIBLE",
  "confiance": 0.95,
  "texte_complet": "...",
  "donnees": {
    "nom": "...",
    "prenom": "...",
    "date_naissance": "YYYY-MM-DD",
    "numero_document": "...",
    "date_expiration": "YYYY-MM-DD"
  },
  "alertes": ["Document expiré" si applicable]
}`,
    
    BULLETIN_SALAIRE: `Extrais les données de ce bulletin de salaire.
Format JSON:
{
  "donnees": {
    "employeur": "...",
    "periode": "MM/YYYY",
    "salaire_brut": 2500.00,
    "salaire_net": 1950.00
  },
  "alertes": ["Période > 3 mois" si applicable]
}`,
    // etc.
  }
  
  return prompts[type] || prompts.CARTE_IDENTITE
}
```

---

## 2.3 Interface Frontend (UI/UX)

### Composants clés Phase 2

#### 1. Page Intake (upload documents)
**Fichier** : `src/app/(client)/intake/[dossierId]/page.tsx`

**UI Flow** :
```
┌────────────────────────────────────────┐
│  Étape 1/3 : Upload de vos documents  │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  📄 Glissez vos documents ici    │ │
│  │  ou cliquez pour sélectionner    │ │
│  │                                  │ │
│  │  Formats: PDF, JPG, PNG, DOCX   │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Documents uploadés:                   │
│  ✓ carte_identite.jpg [VALIDÉ]       │
│    └─ Article: Code Civil Art. 229    │
│  ⚠ bulletin_salaire.pdf [FLOUE]      │
│    └─ Qualité moyenne, re-scanner?    │
│                                        │
│  [Continuer vers paiement] →          │
└────────────────────────────────────────┘
```

#### 2. Composant DocumentUploader
**Fichier** : `src/components/client/DocumentUploader.tsx`

```tsx
export function DocumentUploader({ dossierId, pays }: Props) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: async (files) => {
      for (const file of files) {
        await uploadDocument(file, dossierId, pays)
      }
    }
  })
  
  async function uploadDocument(file: File, dossierId: string, pays: Pays) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('dossierId', dossierId)
    formData.append('type', detectDocumentType(file.name))
    formData.append('pays', pays)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    // Afficher résultat OCR + validation
    showOCRResult(result)
  }
  
  return (
    <div {...getRootProps()} className="border-2 border-dashed p-12">
      <input {...getInputProps()} />
      <p>Glissez vos documents ici</p>
    </div>
  )
}
```

#### 3. Composant DocumentValidation (résultat OCR)
```tsx
export function DocumentValidation({ document, ocr, validation }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {document.nomOriginal}
          <Badge variant={ocr.qualiteImage === 'BONNE' ? 'success' : 'warning'}>
            {ocr.qualiteImage}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {validation.estExige && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Document exigé</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  {validation.articleLoi}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {ocr.alertes.map((alerte, i) => (
          <Alert key={i} variant="warning">
            <AlertDescription>{alerte}</AlertDescription>
          </Alert>
        ))}
        
        <div className="mt-4">
          <h4 className="font-semibold">Données extraites:</h4>
          <pre className="text-sm">
            {JSON.stringify(ocr.donneesExtraites, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 2.4 Smart Sourcing (Liens portails gouvernementaux)

### Service : `src/lib/smart-sourcing-service.ts`

```typescript
export function getLienPortailGouvernemental(
  pays: Pays,
  typeDocument: DocumentType
): string | null {
  const liens: Record<Pays, Record<DocumentType, string>> = {
    FRANCE: {
      ACTE_MARIAGE: 'https://www.service-public.fr/particuliers/vosdroits/R1406',
      AVIS_IMPOSITION: 'https://www.impots.gouv.fr/portail/particulier/documents',
      // etc.
    },
    BELGIQUE: {
      ACTE_MARIAGE: 'https://www.belgium.be/fr/famille/couple/mariage',
      AVIS_IMPOSITION: 'https://finances.belgium.be/fr/particuliers',
    },
    SUISSE: {
      ACTE_MARIAGE: 'https://www.ch.ch/fr/mariage-et-partenariat/mariage/',
      AVIS_IMPOSITION: 'https://www.estv.admin.ch/',
    },
    LUXEMBOURG: {
      ACTE_MARIAGE: 'https://guichet.public.lu/fr/citoyens/famille/mariage.html',
      AVIS_IMPOSITION: 'https://impotsdirects.public.lu/',
    }
  }
  
  return liens[pays]?.[typeDocument] || null
}
```

### UI : Bouton "Où trouver ce document ?"

```tsx
export function SmartSourcingLink({ pays, type }: Props) {
  const lien = getLienPortailGouvernemental(pays, type)
  
  if (!lien) return null
  
  return (
    <a 
      href={lien} 
      target="_blank" 
      className="flex items-center gap-2 text-blue-600"
    >
      <ExternalLink className="w-4 h-4" />
      <span>Où trouver ce document ?</span>
    </a>
  )
}
```

---

## 2.5 Instructions Prompting pour Builder IA

### 🎯 Prompt Phase 2 - Session 1 : Upload & OCR

```
TÂCHE PHASE 2:
Implémente le système d'upload de documents avec OCR automatique.

ACTIONS:

1. SERVICE OCR:
   - Crée src/lib/ocr-service.ts
   - Fonction extraireDocumentOCR(filePath, type, pays):
     a) Télécharge fichier depuis Supabase Storage
     b) Convertit en base64
     c) Appelle Claude Vision avec prompt spécifique au type de document
     d) Parse réponse JSON
   
   PROMPTS OCR PAR TYPE:
   - CARTE_IDENTITE: Extraire nom, prénom, date_naissance, numero, date_expiration
   - BULLETIN_SALAIRE: Extraire employeur, période, salaire_brut, salaire_net
   - AVIS_IMPOSITION: Extraire année, revenu_fiscal, montant_impot
   - etc.
   
   FORMAT RÉPONSE:
   {
     "qualite": "BONNE|MOYENNE|FLOUE|ILLISIBLE",
     "confiance": 0.95,
     "texte_complet": "...",
     "donnees": { ... },
     "alertes": []
   }

2. API UPLOAD:
   - Crée src/app/api/upload/route.ts
   - POST multipart/form-data
   - Steps:
     a) Upload fichier → Supabase Storage
     b) Appeler extraireDocumentOCR()
     c) Appeler validerDocumentRAG() (Phase 1)
     d) Enregistrer Document dans Prisma
   - Retourne: { document, ocr, validation }

3. CONFIGURATION SUPABASE:
   - Créer bucket 'documents' dans Supabase Storage
   - Politique: Lecture authentifiée, écriture service role
   - Créer .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

4. PAGE INTAKE:
   - Crée src/app/(client)/intake/[dossierId]/page.tsx
   - react-dropzone pour drag & drop
   - acceptedFiles: PDF, JPG, PNG, DOCX
   - maxSize: 10MB
   - onDrop: Appelle uploadDocument()

5. COMPOSANT DOCUMENT UPLOADER:
   - Crée src/components/client/DocumentUploader.tsx
   - Zone dropzone stylisée (Tailwind)
   - Progress bar pendant upload
   - Liste documents avec statut (loading, success, error)

6. COMPOSANT VALIDATION:
   - Crée src/components/client/DocumentValidation.tsx
   - Affiche:
     * Badge qualité (vert si BONNE, jaune si MOYENNE, rouge si FLOUE)
     * Icône ⚖️ + tooltip si exigé légalement (avec article)
     * Données extraites (JSON pretty-print)
     * Alertes (si document expiré, illisible, etc.)

TESTS:
- Upload PDF → OCR extrait texte
- Upload image CNI → Extrait nom, prénom, etc.
- Upload image floue → Détecte qualité FLOUE
- Validation RAG: Document exigé → Affiche article de loi
```

### 🎯 Prompt Phase 2 - Session 2 : Smart Sourcing

```
TÂCHE PHASE 2 (suite):
Ajoute des liens vers les portails gouvernementaux pour aider les clients.

ACTIONS:

1. SERVICE SMART SOURCING:
   - Crée src/lib/smart-sourcing-service.ts
   - Fonction getLienPortailGouvernemental(pays, type)
   - Retourne URL officielle ou null
   
   LIENS PAR PAYS:
   FRANCE:
   - ACTE_MARIAGE → service-public.fr
   - AVIS_IMPOSITION → impots.gouv.fr
   - etc.
   
   BELGIQUE:
   - ACTE_MARIAGE → belgium.be
   - AVIS_IMPOSITION → finances.belgium.be
   
   SUISSE:
   - ACTE_MARIAGE → ch.ch
   - AVIS_IMPOSITION → estv.admin.ch
   
   LUXEMBOURG:
   - ACTE_MARIAGE → guichet.public.lu
   - AVIS_IMPOSITION → impotsdirects.public.lu

2. COMPOSANT SMART SOURCING:
   - Crée src/components/client/SmartSourcingLink.tsx
   - Affiche lien avec icône ExternalLink (lucide-react)
   - Target _blank
   - Texte: "Où trouver ce document ?"

3. INTÉGRATION DANS INTAKE:
   - Dans DocumentUploader, afficher SmartSourcingLink pour chaque type
   - Si document manquant: Badge "Recommandé" + SmartSourcingLink

DESIGN:
- Liens bleu primaire
- Icône externe
- Hover: soulignement
```

---

## 2.6 Checklist Phase 2

- [ ] Service OCR créé (ocr-service.ts)
- [ ] API /api/upload fonctionnelle
- [ ] Supabase Storage configuré (bucket documents)
- [ ] Page intake créée
- [ ] Composant DocumentUploader avec drag & drop
- [ ] Composant DocumentValidation avec badges
- [ ] OCR extrait données structurées (nom, montants, etc.)
- [ ] Validation RAG affiche articles de loi
- [ ] Service SmartSourcing créé
- [ ] Liens portails affichés pour chaque type
- [ ] Tests: Upload PDF, Image CNI, Bulletin salaire
- [ ] Tests: Détection qualité (BONNE vs FLOUE)

---

# PHASE 3 : TUNNEL DE PAIEMENT STRIPE
**Durée estimée** : Builder IA - 1-2 sessions

## 3.1 Architecture de Données

Aucune modification schema (déjà prévu en Phase 1) :
- `Dossier.stripePaymentIntent`
- `Dossier.stripePaid`
- `Dossier.stripePaidAt`

---

## 3.2 Logique Backend

### API Routes à créer

#### `/api/payment/create/route.ts` - Créer Payment Intent

```typescript
export async function POST(request: Request) {
  const { dossierId } = await request.json()
  
  // 1. Récupérer dossier
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: { client: true }
  })
  
  if (!dossier) throw new Error('Dossier introuvable')
  if (dossier.stripePaid) throw new Error('Déjà payé')
  
  // 2. Créer Payment Intent Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(dossier.montantTTC * 100), // 149€ = 14900 centimes
    currency: 'eur',
    metadata: {
      dossierId: dossier.id,
      clientId: dossier.clientId,
      pays: dossier.pays
    },
    description: `Analyse dossier divorce - Réf: ${dossier.reference}`,
    receipt_email: dossier.client.email,
    automatic_payment_methods: { enabled: true }
  })
  
  // 3. Mettre à jour dossier
  await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      stripePaymentIntent: paymentIntent.id,
      statut: 'EN_ATTENTE_PAIEMENT'
    }
  })
  
  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    montant: dossier.montantTTC
  })
}
```

#### `/api/webhook/stripe/route.ts` - Webhook Stripe

```typescript
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!
  
  try {
    // 1. Vérifier signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    
    // 2. Traiter événement
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaiementReussi(event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaiementEchoue(event.data.object)
        break
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook failed' },
      { status: 400 }
    )
  }
}

async function handlePaiementReussi(paymentIntent: any) {
  const dossierId = paymentIntent.metadata.dossierId
  
  // 1. Marquer comme payé
  await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      stripePaid: true,
      stripePaidAt: new Date(),
      statut: 'PAYE'
    }
  })
  
  // 2. Déclencher analyse IA (async)
  await triggerAnalyseIA(dossierId)
  
  // 3. Envoyer email confirmation client
  await envoyerEmailConfirmation(dossierId)
  
  // 4. Notifier avocat
  await notifierAvocat(dossierId)
}
```

---

## 3.3 Interface Frontend (UI/UX)

### Page paiement

**Fichier** : `src/app/(client)/payment/page.tsx`

**UI** :
```
┌────────────────────────────────────────┐
│  Étape 2/3 : Paiement sécurisé        │
├────────────────────────────────────────┤
│                                        │
│  Récapitulatif:                        │
│  ┌──────────────────────────────────┐ │
│  │ Analyse IA de votre dossier      │ │
│  │ 149,00 €                         │ │
│  │                                  │ │
│  │ dont 30€ frais de gestion        │ │
│  │                                  │ │
│  │ Documents uploadés: 5            │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 💳 Carte bancaire                │ │
│  │ [Stripe Elements ici]            │ │
│  └──────────────────────────────────┘ │
│                                        │
│  🔒 Paiement 100% sécurisé par Stripe │
│                                        │
│  [ Payer 149€ ] →                     │
└────────────────────────────────────────┘
```

### Composant Stripe

```tsx
'use client'

import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function PaymentForm({ dossierId }: Props) {
  const [clientSecret, setClientSecret] = useState('')
  
  useEffect(() => {
    // Créer Payment Intent
    fetch('/api/payment/create', {
      method: 'POST',
      body: JSON.stringify({ dossierId })
    })
      .then(r => r.json())
      .then(data => setClientSecret(data.clientSecret))
  }, [dossierId])
  
  if (!clientSecret) return <Loading />
  
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  )
}

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    if (!stripe || !elements) return
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`
      }
    })
    
    if (error) {
      toast.error(error.message)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" className="mt-4">
        Payer 149€
      </Button>
    </form>
  )
}
```

---

## 3.4 Instructions Prompting pour Builder IA

### 🎯 Prompt Phase 3 : Paiement Stripe

```
TÂCHE PHASE 3:
Implémente le tunnel de paiement Stripe avant envoi à l'avocat.

PRÉREQUIS:
- Compte Stripe créé (mode test)
- Clés API: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- Installer: npm install stripe @stripe/stripe-js @stripe/react-stripe-js

ACTIONS:

1. API PAYMENT CREATE:
   - Crée src/app/api/payment/create/route.ts
   - POST avec { dossierId }
   - Steps:
     a) Récupérer dossier + client
     b) Vérifier non déjà payé
     c) Créer stripe.paymentIntents.create:
        - amount: 14900 (149€ en centimes)
        - currency: 'eur'
        - metadata: { dossierId, clientId, pays }
        - receipt_email: client.email
     d) Mettre à jour dossier.stripePaymentIntent
     e) Statut → EN_ATTENTE_PAIEMENT
   - Retourne: { clientSecret, montant }

2. API WEBHOOK STRIPE:
   - Crée src/app/api/webhook/stripe/route.ts
   - POST (body raw text)
   - Vérifier signature avec stripe.webhooks.constructEvent
   - Gérer événements:
     * payment_intent.succeeded → handlePaiementReussi()
     * payment_intent.payment_failed → handlePaiementEchoue()
   
   handlePaiementReussi:
   a) Mettre à jour dossier: stripePaid=true, statut=PAYE
   b) TODO Phase 4: Déclencher analyse IA
   c) TODO: Envoyer email confirmation
   d) TODO: Notifier avocat

3. PAGE PAIEMENT:
   - Crée src/app/(client)/payment/page.tsx
   - Récupère dossierId depuis searchParams
   - Affiche récapitulatif:
     * Montant: 149€ TTC
     * dont 30€ frais gestion
     * Nombre documents uploadés
   - Composant PaymentForm

4. COMPOSANT PAYMENT FORM:
   - Crée src/components/client/PaymentForm.tsx
   - loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   - Elements wrapper avec clientSecret
   - PaymentElement (Stripe Elements)
   - Bouton "Payer 149€"
   - confirmPayment avec return_url → /confirmation

5. PAGE CONFIRMATION:
   - Crée src/app/(client)/confirmation/page.tsx
   - Récupère payment_intent depuis searchParams
   - Vérifier statut du paiement
   - Affiche:
     * ✅ Paiement réussi
     * "Votre dossier est en cours d'analyse"
     * "Vous recevrez un email de confirmation"

6. CONFIGURATION STRIPE:
   - Dashboard Stripe → Webhooks
   - Ajouter endpoint: https://votre-app.com/api/webhook/stripe
   - Événements: payment_intent.succeeded, payment_intent.payment_failed
   - Récupérer STRIPE_WEBHOOK_SECRET

TESTS:
- Mode test Stripe: Carte 4242 4242 4242 4242
- Vérifier Payment Intent créé
- Vérifier webhook reçu après paiement
- Vérifier statut dossier → PAYE
```

---

## 3.5 Checklist Phase 3

- [ ] Compte Stripe créé (mode test)
- [ ] Clés API configurées (.env)
- [ ] npm install stripe @stripe/stripe-js @stripe/react-stripe-js
- [ ] API /api/payment/create fonctionnelle
- [ ] API /api/webhook/stripe fonctionnelle
- [ ] Webhook configuré dans Dashboard Stripe
- [ ] Page paiement créée
- [ ] Composant PaymentForm avec Stripe Elements
- [ ] Page confirmation créée
- [ ] Tests: Paiement test avec carte 4242...
- [ ] Tests: Webhook reçu et traité
- [ ] Tests: Statut dossier passe à PAYE

---

# PHASE 4 : DASHBOARD AVOCAT & ANALYSE IA
**Durée estimée** : Builder IA - 3-4 sessions

## 4.1 Architecture de Données

Aucune modification (déjà prévu) :
- `Dossier.analyseIA`
- `Dossier.syntheseHTML`
- `Dossier.sourcesLegales`

---

## 4.2 Logique Backend

### API Routes à créer

#### `/api/analyse/dossier/route.ts` - Analyser dossier complet

```typescript
export async function POST(request: Request) {
  const { dossierId } = await request.json()
  
  // 1. Récupérer dossier + documents
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      documents: true,
      client: true
    }
  })
  
  if (!dossier) throw new Error('Dossier introuvable')
  
  // 2. Marquer en cours
  await prisma.dossier.update({
    where: { id: dossierId },
    data: { statut: 'EN_ANALYSE' }
  })
  
  // 3. Extraire toutes les données des documents
  const donneesExtraites = dossier.documents
    .filter(d => d.donneesExtraites)
    .map(d => JSON.parse(d.donneesExtraites))
  
  // 4. Construire question RAG
  const question = `Analyse ce dossier de divorce et génère:
1. Un tableau du patrimoine (immobilier, épargne, véhicules)
2. Un tableau des revenus de chaque époux
3. Un tableau des charges (loyer, crédits, pensions)
4. Une synthèse de la situation patrimoniale

Données extraites: ${JSON.stringify(donneesExtraites, null, 2)}

Cite les articles de loi pertinents pour le partage selon le régime matrimonial.`
  
  // 5. Appel RAG
  const response = await queryRAG(dossier.pays, question)
  
  // 6. Générer HTML
  const syntheseHTML = generateSyntheseHTML(response, dossier)
  
  // 7. Mettre à jour dossier
  await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      analyseIA: response.reponse,
      syntheseHTML,
      sourcesLegales: JSON.stringify(response.sources),
      statut: 'ANALYSE_TERMINEE'
    }
  })
  
  return NextResponse.json({ success: true })
}
```

---

## 4.3 Interface Frontend (UI/UX)

### 1. Dashboard liste dossiers
**Fichier** : `src/app/(avocat)/dashboard/page.tsx`

**UI** :
```
┌────────────────────────────────────────────────────┐
│  Dashboard Avocat                      [Déconnexion]│
├────────────────────────────────────────────────────┤
│                                                    │
│  Filtres: [Tous] [Payés] [Analysés] [Validés]    │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Réf: DOS-2024-001 | Martin Sophie            │ │
│  │ 🟢 Payé | Analysé | 5 documents               │ │
│  │ [Voir le dossier] →                           │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Réf: DOS-2024-002 | Dupont Jean              │ │
│  │ 🟡 En attente paiement | 3 documents          │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 2. Dashboard split-view dossier
**Fichier** : `src/app/(avocat)/dashboard/[id]/page.tsx`

**UI** :
```
┌─────────────────────────────────────────────────────────────┐
│ Dossier DOS-2024-001 | Martin Sophie    [Valider] [Exporter]│
├───────────────────────┬─────────────────────────────────────┤
│ SYNTHÈSE IA (40%)     │ DOCUMENTS (60%)                     │
│                       │                                     │
│ [Patrimoine] [Revenus]│ ┌─────────────────────────────────┐ │
│                       │ │                                 │ │
│ Patrimoine immobilier │ │   [PDF Viewer]                  │ │
│ ┌───────────────────┐ │ │                                 │ │
│ │ Bien | Valeur  │⚖│ │ │   carte_identite.jpg            │ │
│ ├──────┼─────────┼──┤ │ │                                 │ │
│ │Maison│250000€ │📄│ │ │                                 │ │
│ │      │(clic→) │  │ │ │   [Highlighted zone]            │ │
│ └──────┴────────┴──┘ │ │                                 │ │
│                       │ └─────────────────────────────────┘ │
│ ⚖ Art. 1387 CC:       │                                     │
│ "Communauté réduite..." │ [← Prev] [Next →]                 │
│                       │                                     │
└───────────────────────┴─────────────────────────────────────┘
```

### 3. Composant SplitView
```tsx
export function SplitView({ dossier, documents }: Props) {
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [highlightZone, setHighlightZone] = useState(null)
  
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={40}>
        <SynthesePanel 
          dossier={dossier}
          onDataClick={(docId, zone) => {
            setSelectedDocument(docId)
            setHighlightZone(zone)
          }}
        />
      </ResizablePanel>
      
      <ResizableHandle />
      
      <ResizablePanel defaultSize={60}>
        <DocumentViewer 
          document={selectedDocument}
          highlightZone={highlightZone}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### 4. Composant SynthesePanel (tableaux)
```tsx
export function SynthesePanel({ dossier, onDataClick }: Props) {
  const patrimoine = JSON.parse(dossier.analyseIA).patrimoine
  
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="patrimoine">Patrimoine</TabsTrigger>
        <TabsTrigger value="revenus">Revenus</TabsTrigger>
        <TabsTrigger value="charges">Charges</TabsTrigger>
      </TabsList>
      
      <TabsContent value="patrimoine">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bien</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>⚖</TooltipTrigger>
                    <TooltipContent>
                      Art. 1387 Code Civil
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patrimoine.map((bien, i) => (
              <TableRow key={i}>
                <TableCell>{bien.nom}</TableCell>
                <TableCell 
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => onDataClick(bien.documentId, bien.zone)}
                >
                  {bien.valeur}€
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    📄
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  )
}
```

### 5. Composant DocumentViewer
```tsx
export function DocumentViewer({ document, highlightZone }: Props) {
  if (!document) {
    return <div className="p-8 text-center">Sélectionnez une donnée</div>
  }
  
  if (document.mimeType === 'application/pdf') {
    return (
      <PDFViewer 
        url={document.cheminStorage}
        highlightZone={highlightZone}
      />
    )
  }
  
  return (
    <ImageViewer 
      url={document.cheminStorage}
      highlightZone={highlightZone}
    />
  )
}
```

---

## 4.4 Instructions Prompting pour Builder IA

### 🎯 Prompt Phase 4 - Session 1 : Analyse IA

```
TÂCHE PHASE 4:
Implémente l'analyse IA automatique du dossier après paiement.

ACTIONS:

1. API ANALYSE:
   - Crée src/app/api/analyse/dossier/route.ts
   - POST avec { dossierId }
   - Steps:
     a) Récupérer dossier + documents
     b) Extraire donneesExtraites de chaque document
     c) Construire question RAG:
        "Analyse ce dossier et génère:
        1. Tableau patrimoine
        2. Tableau revenus
        3. Tableau charges
        4. Synthèse situation
        
        Cite articles de loi pour partage."
     d) Appeler queryRAG() (Phase 1)
     e) Générer HTML avec tableaux
     f) Mettre à jour dossier: analyseIA, syntheseHTML, sourcesLegales
     g) Statut → ANALYSE_TERMINEE

2. TRIGGER ANALYSE APRÈS PAIEMENT:
   - Dans handlePaiementReussi() (Phase 3)
   - Appeler /api/analyse/dossier async
   
3. FONCTION GENERATE SYNTHESE HTML:
   - Parse réponse RAG
   - Génère HTML avec:
     * <table> patrimoine
     * <table> revenus
     * <table> charges
     * <div> synthèse
     * <div> sources légales
   - Retourne string HTML

TESTS:
- Payer dossier test
- Vérifier webhook déclenche analyse
- Vérifier analyseIA rempli
- Vérifier sourcesLegales cite articles
```

### 🎯 Prompt Phase 4 - Session 2 : Dashboard Liste

```
TÂCHE PHASE 4 (suite):
Crée le dashboard avocat avec liste des dossiers.

ACTIONS:

1. AUTH AVOCAT (simple pour MVP):
   - Crée src/app/(avocat)/login/page.tsx
   - Form email/password
   - Pour MVP: Vérifier passwordHash avec bcrypt
   - Session: NextAuth ou simple JWT

2. PAGE DASHBOARD:
   - Crée src/app/(avocat)/dashboard/page.tsx
   - Server Component
   - Récupérer dossiers de l'avocat connecté:
     WHERE avocat.email = session.user.email
     AND stripePaid = true
     ORDER BY stripePaidAt DESC
   
3. COMPOSANT DOSSIER CARD:
   - Crée src/components/avocat/DossierCard.tsx
   - Affiche:
     * Référence
     * Client (nom)
     * Statut (badge coloré)
     * Nombre documents
     * Bouton "Voir le dossier" → /dashboard/[id]

4. FILTRES:
   - Tabs: Tous, Payés, Analysés, Validés
   - Filtre par statut

DESIGN:
- Interface pro (type dashboard analytics)
- Cards épurées
- Badges colorés statut
```

### 🎯 Prompt Phase 4 - Session 3 : Split-View

```
TÂCHE PHASE 4 (suite):
Crée la vue split-view avec source-mapping.

ACTIONS:

1. PAGE DOSSIER:
   - Crée src/app/(avocat)/dashboard/[id]/page.tsx
   - Server Component
   - Récupérer dossier + documents
   - Parser analyseIA (JSON)
   - Render SplitView component

2. COMPOSANT SPLIT VIEW:
   - Crée src/components/avocat/SplitView.tsx
   - ResizablePanelGroup (shadcn/ui)
   - 2 panels: Synthèse (40%) | Documents (60%)
   - State partagé: selectedDocument, highlightZone

3. COMPOSANT SYNTHESE PANEL:
   - Crée src/components/avocat/SynthesePanel.tsx
   - Tabs: Patrimoine, Revenus, Charges
   - Tables avec données parsées de analyseIA
   - onDataClick → setSelectedDocument + setHighlightZone
   - Tooltip ⚖ sur chaque section → Article de loi

4. COMPOSANT DOCUMENT VIEWER:
   - Crée src/components/avocat/DocumentViewer.tsx
   - Si PDF: react-pdf
   - Si Image: <Image> avec overlay highlight
   - highlightZone: { x, y, width, height }
   - Scroll auto vers zone

5. SOURCE-MAPPING:
   - Dans donneesExtraites: Stocker position { page, x, y, w, h }
   - Au clic sur montant → Focus document + highlight zone

DESIGN:
- ResizableHandle avec indicateur
- PDF viewer avec navigation (prev/next page)
- Highlight jaune translucide
- Smooth scroll
```

### 🎯 Prompt Phase 4 - Session 4 : Validation & Export

```
TÂCHE PHASE 4 (suite):
Ajoute validation avocat et export ZIP.

ACTIONS:

1. BOUTON VALIDER:
   - Dans header dashboard/[id]
   - Modal confirmation
   - POST /api/avocat/valider
   - Met à jour statut → VALIDE
   - Programme purge J+7

2. API VALIDATION:
   - Crée src/app/api/avocat/valider/route.ts
   - POST { dossierId, modifications }
   - Enregistre modifications JSON
   - Met à jour datePurge = now + 7 jours
   - Statut → VALIDE

3. ÉDITION DONNÉES:
   - Inputs éditables dans tableaux
   - State local modifications
   - Envoyé lors validation

4. EXPORT ZIP:
   - Bouton "Exporter ZIP"
   - POST /api/avocat/export
   - Télécharge documents depuis Supabase
   - Renomme: 01_carte_identite.pdf, 02_bulletin_salaire.pdf
   - Génère rapport_synthese.pdf (HTML → PDF)
   - Zip avec JSZip
   - Download

5. API EXPORT:
   - Crée src/app/api/avocat/export/route.ts
   - Récupère dossier + documents
   - Download depuis Supabase Storage
   - Génère PDF synthèse (puppeteer ou html-pdf)
   - Zip avec jszip
   - Retourne blob

TESTS:
- Modifier montant dans tableau
- Valider dossier
- Vérifier datePurge = J+7
- Exporter ZIP
- Vérifier fichiers renommés + rapport PDF
```

---

## 4.5 Checklist Phase 4

- [ ] API /api/analyse/dossier créée
- [ ] Analyse déclenchée après paiement (webhook)
- [ ] analyseIA, syntheseHTML, sourcesLegales remplis
- [ ] Page login avocat créée
- [ ] Page dashboard liste créée
- [ ] Composant DossierCard avec filtres
- [ ] Page dashboard/[id] split-view créée
- [ ] Composant SplitView (ResizablePanels)
- [ ] Composant SynthesePanel avec tabs/tables
- [ ] Composant DocumentViewer (PDF + Image)
- [ ] Source-mapping: Clic donnée → Highlight document
- [ ] Tooltip ⚖ affiche article de loi
- [ ] Bouton Valider + modal confirmation
- [ ] API /api/avocat/valider créée
- [ ] datePurge programmée J+7
- [ ] Bouton Export ZIP créé
- [ ] API /api/avocat/export créée
- [ ] ZIP contient documents renommés + rapport PDF

---

# PHASE 5 : PURGE RGPD & SÉCURITÉ
**Durée estimée** : Builder IA - 1 session

## 5.1 Logique Backend

### Cron Job : Purge automatique J+7

**Fichier** : `src/app/api/cron/purge/route.ts`

```typescript
export async function GET(request: Request) {
  // 1. Sécurité: Vérifier autorisation cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const now = new Date()
  
  // 2. Trouver dossiers à purger
  const dossiers = await prisma.dossier.findMany({
    where: {
      datePurge: { lte: now },
      isPurged: false
    },
    include: { documents: true }
  })
  
  for (const dossier of dossiers) {
    // 3. Supprimer fichiers Supabase Storage
    for (const doc of dossier.documents) {
      await supabase.storage
        .from('documents')
        .remove([doc.cheminStorage])
    }
    
    // 4. Anonymiser données client
    await prisma.dossier.update({
      where: { id: dossier.id },
      data: {
        isPurged: true,
        purgedAt: now,
        statut: 'PURGE',
        // Anonymiser
        analyseIA: null,
        syntheseHTML: null
      }
    })
    
    // 5. Purger documents
    await prisma.document.updateMany({
      where: { dossierId: dossier.id },
      data: {
        isPurged: true,
        purgedAt: now,
        texteExtrait: null,
        donneesExtraites: null
      }
    })
    
    console.log(`✅ Dossier ${dossier.reference} purgé`)
  }
  
  return NextResponse.json({
    success: true,
    purged: dossiers.length
  })
}
```

---

## 5.2 Instructions Prompting pour Builder IA

### 🎯 Prompt Phase 5 : Purge RGPD

```
TÂCHE PHASE 5:
Implémente la purge automatique RGPD J+7.

ACTIONS:

1. API CRON PURGE:
   - Crée src/app/api/cron/purge/route.ts
   - GET endpoint
   - Sécurité: Vérifier Authorization header = Bearer CRON_SECRET
   - Steps:
     a) Trouver dossiers WHERE datePurge <= now AND isPurged = false
     b) Pour chaque dossier:
        - Supprimer fichiers Supabase Storage
        - Anonymiser: analyseIA = null, syntheseHTML = null
        - Purger documents: texteExtrait = null, donneesExtraites = null
        - Marquer isPurged = true, purgedAt = now
     c) Logs détaillés
   - Retourne: { success, purged: count }

2. CONFIGURATION CRON (RENDER):
   - Dashboard Render > New > Cron Job
   - Name: purge-rgpd
   - Schedule: "0 2 * * *" (2h du matin chaque jour)
   - Command: curl -H "Authorization: Bearer $CRON_SECRET" https://votre-app.onrender.com/api/cron/purge

3. TESTS MANUELS:
   - Créer dossier test avec datePurge = now - 1 jour
   - Appeler manuellement /api/cron/purge avec header auth
   - Vérifier:
     * Fichiers supprimés de Supabase
     * analyseIA = null
     * isPurged = true

SÉCURITÉ:
- CRON_SECRET fort (32+ caractères aléatoires)
- Logs audit trail
- Vérifier auth AVANT toute action
```

---

## 5.3 Checklist Phase 5

- [ ] API /api/cron/purge créée
- [ ] Vérification Authorization header
- [ ] Suppression fichiers Supabase Storage
- [ ] Anonymisation données dossier
- [ ] Purge données documents
- [ ] Logs détaillés
- [ ] Cron job configuré sur Render (2h du matin)
- [ ] Tests: Purge manuelle fonctionne
- [ ] Tests: Fichiers bien supprimés
- [ ] Tests: Données anonymisées

---

# 🎯 PRE-FLIGHT CHECKLIST

## Avant lancement production

### 🔐 Sécurité

- [ ] Toutes clés API en variables d'environnement (pas hardcodées)
- [ ] CRON_SECRET fort (32+ caractères)
- [ ] Stripe Webhook Secret configuré
- [ ] CORS restreint au domaine production
- [ ] Rate limiting activé (upload, API)
- [ ] Headers sécurité (CSP, HSTS, etc.)

### 💳 Paiement Stripe

- [ ] Compte Stripe en mode LIVE (pas test)
- [ ] Clés LIVE configurées
- [ ] Webhook production configuré
- [ ] Test paiement réel (petite somme)
- [ ] Vérifier webhook reçu et traité
- [ ] Vérifier statut dossier passe à PAYE
- [ ] Vérifier analyse IA déclenchée

### 🗑️ Purge RGPD

- [ ] Cron job actif sur Render
- [ ] Test purge manuelle réussi
- [ ] Vérifier fichiers supprimés Supabase
- [ ] Vérifier données anonymisées DB
- [ ] Logs audit trail fonctionnels
- [ ] Date purge = J+7 après validation

### 📊 Monitoring

- [ ] Sentry configuré (error tracking)
- [ ] Logs centralisés
- [ ] Alertes email si service down
- [ ] Dashboard Render surveillé

### 🧪 Tests bout-en-bout

- [ ] Créer compte client test
- [ ] Détecter pays (France)
- [ ] Upload 5 documents
- [ ] Vérifier OCR extrait données
- [ ] Vérifier validation RAG (articles loi)
- [ ] Payer 149€ (Stripe test ou réel)
- [ ] Vérifier webhook traité
- [ ] Vérifier analyse IA lancée
- [ ] Vérifier synthèse HTML générée
- [ ] Login avocat
- [ ] Voir dossier dans liste
- [ ] Ouvrir split-view
- [ ] Vérifier source-mapping (clic → highlight)
- [ ] Valider dossier
- [ ] Vérifier datePurge = J+7
- [ ] Exporter ZIP
- [ ] Vérifier contenu ZIP (docs + rapport)
- [ ] Attendre J+7 ou forcer purge
- [ ] Vérifier données purgées

### 📝 Documentation

- [ ] README.md à jour
- [ ] Guide utilisateur client
- [ ] Guide utilisateur avocat
- [ ] Documentation API (si nécessaire)

### 🚀 Déploiement

- [ ] Build production réussit
- [ ] Tests E2E passent
- [ ] Base de données seedée (textes lois)
- [ ] Supabase Storage configuré
- [ ] Render web service actif
- [ ] Render cron job actif
- [ ] DNS configuré (domaine custom)
- [ ] SSL actif

---

**🎉 SI TOUTES LES CASES SONT COCHÉES → PRÊT POUR LANCEMENT !**
