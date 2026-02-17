import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Build database URL with connection pool settings
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) return undefined
  
  // Add connection pool settings for Supabase
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}connection_limit=1&pool_timeout=10`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    }
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
