import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * API GET /api/dossier/[id]/export-pdf
 * Génère et télécharge un PDF de la synthèse du dossier
 *
 * Utilise le syntheseHTML généré par l'IA pour créer un PDF
 * via Puppeteer ou un service de conversion HTML→PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. Récupérer le dossier
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true
      }
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier introuvable' },
        { status: 404 }
      )
    }

    // 2. Vérifier que la synthèse HTML existe
    if (!dossier.syntheseHTML) {
      return NextResponse.json(
        { error: 'Le dossier n\'a pas encore été analysé' },
        { status: 400 }
      )
    }

    console.log(`📄 Génération PDF pour dossier ${dossier.reference}`)

    // 3. Créer le répertoire temporaire si nécessaire
    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true })
    }

    // 4. Écrire le HTML dans un fichier temporaire
    const htmlPath = path.join(tmpDir, `${dossier.id}.html`)
    await writeFile(htmlPath, dossier.syntheseHTML, 'utf-8')

    // 5. Nom du fichier PDF
    const pdfFilename = `synthese_${dossier.reference}_${Date.now()}.pdf`
    const pdfPath = path.join(tmpDir, pdfFilename)

    // 6. Convertir HTML → PDF
    // Option A: Utiliser wkhtmltopdf (si installé)
    // Option B: Utiliser Chrome headless via Puppeteer (nécessite installation)
    // Option C: Utiliser un service externe

    try {
      // Tenter wkhtmltopdf d'abord (plus léger)
      await execAsync(`wkhtmltopdf "${htmlPath}" "${pdfPath}"`)
      console.log('✅ PDF généré avec wkhtmltopdf')
    } catch (wkError) {
      console.warn('⚠️ wkhtmltopdf non disponible, essai avec Chrome headless')

      try {
        // Fallback: Chrome headless
        // Nécessite chrome/chromium installé
        await execAsync(`google-chrome --headless --disable-gpu --print-to-pdf="${pdfPath}" "${htmlPath}"`)
        console.log('✅ PDF généré avec Chrome headless')
      } catch (chromeError) {
        console.error('❌ Erreur génération PDF:', chromeError)

        // Fallback ultime: retourner le HTML directement
        return new NextResponse(dossier.syntheseHTML, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="synthese_${dossier.reference}.html"`
          }
        })
      }
    }

    // 7. Lire le PDF généré
    const { readFile } = require('fs/promises')
    const pdfBuffer = await readFile(pdfPath)

    // 8. Nettoyer les fichiers temporaires
    try {
      const { unlink } = require('fs/promises')
      await unlink(htmlPath)
      await unlink(pdfPath)
    } catch (cleanupError) {
      console.warn('⚠️ Erreur nettoyage fichiers temporaires:', cleanupError)
    }

    // 9. Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFilename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('❌ Erreur export PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
