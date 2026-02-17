import { NextRequest, NextResponse } from 'next/server'
import { purgerDossiersExpires } from '@/lib/purge-service'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const purged = await purgerDossiersExpires()
  return NextResponse.json({ success: true, purged })
}
