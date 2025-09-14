// src/app/api/config/liff-id/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  if (!liffId) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_LIFF_ID is not configured' }, { status: 500 })
  }
  return NextResponse.json({ liffId }, { status: 200 })
}

