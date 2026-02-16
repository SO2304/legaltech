// ============================================
// PRISMA 7 CONFIGURATION
// ============================================

import { defineConfig } from '@prisma/client'

export default defineConfig({
  datasourceUrl: process.env.DATABASE_URL,
})
