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
    for (const doc of dossier.documents) {
      await supabase.storage.from('documents').remove([doc.cheminStorage])
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
