import { prisma } from './prisma'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function purgerDossiersExpires() {
  const now = new Date()
  
  const dossiers = await prisma.dossier.findMany({
    where: {
      datePurge: { lte: now },
      isPurged: false
    },
    include: { documents: true }
  })
  
  for (const dossier of dossiers) {
    // Collect all file paths to delete
    const filePaths = dossier.documents.map(doc => doc.nomStockage)
    
    // Delete all documents for this dossier from storage
    if (filePaths.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove(filePaths)
      
      if (deleteError) {
        console.error('Error deleting documents:', deleteError)
      }
    }
    
    await prisma.dossier.update({
      where: { id: dossier.id },
      data: {
        isPurged: true,
        purgedAt: now,
        statut: 'PURGE',
        analyseIA: null,
        syntheseHTML: null
      }
    })
  }
  
  return dossiers.length
}
