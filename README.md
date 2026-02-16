# Divorce Platform

Application SaaS de gestion de dossiers de divorce multi-juridictions.

## Stack

- Next.js 16 + TypeScript
- PostgreSQL + Prisma
- Anthropic Claude (RAG + OCR)
- Stripe Payments
- Supabase Storage

## Setup

```bash
npm install
cp .env.example .env.local
# Remplir .env.local avec vraies clés
npx prisma generate
npx prisma db push
npm run dev
```

## Production

Deploy: Render.com (Europe/Frankfurt)
