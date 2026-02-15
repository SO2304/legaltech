#!/usr/bin/env bun
// ============================================
// AUDIT AUTOMATISÉ DU PROJET LEGALTECH
// Détecte incohérences, redondances, erreurs
// ============================================

import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

interface AuditIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
  file: string
  line?: number
  message: string
  suggestion?: string
}

const issues: AuditIssue[] = []

// ============================================
// 1. CHARGER LE SCHEMA PRISMA
// ============================================
const schemaPath = join(process.cwd(), 'prisma/schema.prisma')
const schemaContent = readFileSync(schemaPath, 'utf-8')

// Extraire les modèles et leurs champs
const models: Map<string, Set<string>> = new Map()
const enums: Map<string, Set<string>> = new Map()

function parseSchema() {
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g

  // Parser les modèles
  let match
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1]
    const fields = match[2]
      .split('\n')
      .map(line => line.trim().split(/\s+/)[0])
      .filter(f => f && !f.startsWith('//') && !f.startsWith('@@'))

    models.set(modelName, new Set(fields))
  }

  // Parser les enums
  while ((match = enumRegex.exec(schemaContent)) !== null) {
    const enumName = match[1]
    const values = match[2]
      .split('\n')
      .map(line => line.trim())
      .filter(v => v && !v.startsWith('//'))

    enums.set(enumName, new Set(values))
  }
}

parseSchema()

console.log('📊 Schéma Prisma chargé:')
console.log(`   - ${models.size} modèles`)
console.log(`   - ${enums.size} enums`)
console.log('')

// ============================================
// 2. VÉRIFIER LES FICHIERS TS/TSX
// ============================================

function walkDir(dir: string, callback: (file: string) => void) {
  const files = readdirSync(dir)

  for (const file of files) {
    const filepath = join(dir, file)
    const stat = statSync(filepath)

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filepath, callback)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filepath)
    }
  }
}

function checkFile(filepath: string) {
  const content = readFileSync(filepath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Vérifier les accès Prisma avec champs inexistants
    models.forEach((fields, modelName) => {
      // Patterns comme: prisma.dossier.update({ data: { champ: ... } })
      const prismaRegex = new RegExp(`prisma\\.${modelName.toLowerCase()}\\.[^(]+\\([^)]*\\{[^}]*data:\\s*\\{([^}]+)\\}`, 'i')
      const match = line.match(prismaRegex)

      if (match) {
        const dataContent = match[1]
        // Extraire les noms de champs
        const fieldMatches = dataContent.matchAll(/(\w+):/g)

        for (const fm of fieldMatches) {
          const fieldName = fm[1]
          if (!fields.has(fieldName) && fieldName !== 'where' && fieldName !== 'include') {
            issues.push({
              severity: 'CRITICAL',
              category: 'Prisma Field',
              file: filepath.replace(process.cwd(), ''),
              line: lineNum,
              message: `Champ inexistant "${fieldName}" sur le modèle ${modelName}`,
              suggestion: `Champs disponibles: ${Array.from(fields).join(', ')}`
            })
          }
        }
      }

      // Vérifier les where clauses
      const whereRegex = new RegExp(`where:\\s*\\{\\s*(\\w+):`, 'g')
      let whereMatch
      while ((whereMatch = whereRegex.exec(line)) !== null) {
        const fieldName = whereMatch[1]
        if (line.includes(`prisma.${modelName.toLowerCase()}`) && !fields.has(fieldName)) {
          issues.push({
            severity: 'CRITICAL',
            category: 'Prisma Field',
            file: filepath.replace(process.cwd(), ''),
            line: lineNum,
            message: `Champ inexistant "${fieldName}" dans where clause sur ${modelName}`,
            suggestion: `Champs disponibles: ${Array.from(fields).join(', ')}`
          })
        }
      }
    })

    // Vérifier les valeurs d'enums
    enums.forEach((values, enumName) => {
      const enumUsageRegex = new RegExp(`statut.*['"](\\w+)['"]`, 'g')
      let enumMatch

      while ((enumMatch = enumUsageRegex.exec(line)) !== null) {
        const value = enumMatch[1]
        if (enumName === 'DossierStatus' && !values.has(value)) {
          issues.push({
            severity: 'HIGH',
            category: 'Enum Value',
            file: filepath.replace(process.cwd(), ''),
            line: lineNum,
            message: `Valeur enum inexistante "${value}" pour DossierStatus`,
            suggestion: `Valeurs disponibles: ${Array.from(values).join(', ')}`
          })
        }
      }
    })

    // Vérifier les imports manquants
    if (line.includes("from '@anthropic-ai/sdk'")) {
      // Vérifier si c'est dans package.json
      const pkgPath = join(process.cwd(), 'package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

      if (!pkg.dependencies['@anthropic-ai/sdk']) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Missing Dependency',
          file: filepath.replace(process.cwd(), ''),
          line: lineNum,
          message: '@anthropic-ai/sdk utilisé mais absent de package.json',
          suggestion: 'Ajouter: npm install @anthropic-ai/sdk'
        })
      }
    }

    // Détecter code mort / imports inutilisés
    if (line.match(/^import\s+.*\s+from/)) {
      const importMatch = line.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from/)
      if (importMatch) {
        const imported = importMatch[1] || importMatch[2] || importMatch[3]
        if (imported) {
          const symbols = imported.split(',').map(s => s.trim().split(' as ')[0].trim())

          symbols.forEach(symbol => {
            // Compter les usages (approximation)
            const usageRegex = new RegExp(`\\b${symbol}\\b`, 'g')
            const matches = content.match(usageRegex)

            if (matches && matches.length === 1) { // Seulement dans l'import
              issues.push({
                severity: 'LOW',
                category: 'Unused Import',
                file: filepath.replace(process.cwd(), ''),
                line: lineNum,
                message: `Import inutilisé: ${symbol}`,
                suggestion: 'Supprimer cet import'
              })
            }
          })
        }
      }
    }

    // Détecter console.log en production
    if (line.includes('console.log(') && !filepath.includes('audit-')) {
      issues.push({
        severity: 'LOW',
        category: 'Console Log',
        file: filepath.replace(process.cwd(), ''),
        line: lineNum,
        message: 'console.log() trouvé dans le code',
        suggestion: 'Utiliser un logger approprié ou supprimer'
      })
    }

    // Détecter TODO/FIXME
    if (line.match(/\/\/\s*(TODO|FIXME|XXX)/i)) {
      issues.push({
        severity: 'MEDIUM',
        category: 'TODO',
        file: filepath.replace(process.cwd(), ''),
        line: lineNum,
        message: line.trim(),
        suggestion: 'Traiter ce point'
      })
    }
  })
}

// Scanner tous les fichiers
console.log('🔍 Scanning des fichiers TypeScript...')
walkDir(join(process.cwd(), 'src'), checkFile)
console.log(`   ✓ Scan terminé`)
console.log('')

// ============================================
// 3. AFFICHER LES RÉSULTATS
// ============================================

const grouped = issues.reduce((acc, issue) => {
  if (!acc[issue.severity]) acc[issue.severity] = []
  acc[issue.severity].push(issue)
  return acc
}, {} as Record<string, AuditIssue[]>)

console.log('═'.repeat(80))
console.log('📋 RAPPORT D\'AUDIT')
console.log('═'.repeat(80))
console.log('')

const severities: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

severities.forEach(severity => {
  const items = grouped[severity] || []
  if (items.length === 0) return

  const icon = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢'
  }[severity]

  console.log(`${icon} ${severity} (${items.length})`)
  console.log('─'.repeat(80))

  items.forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.category}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`)
    console.log(`   ${issue.message}`)
    if (issue.suggestion) {
      console.log(`   💡 ${issue.suggestion}`)
    }
    console.log('')
  })
})

console.log('═'.repeat(80))
console.log(`Total: ${issues.length} problèmes détectés`)
console.log('═'.repeat(80))

// Retourner exit code non-zéro si problèmes critiques
if ((grouped['CRITICAL']?.length || 0) > 0) {
  process.exit(1)
}
