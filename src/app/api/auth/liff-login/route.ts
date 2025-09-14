// src/app/api/auth/liff-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clerkClient as getClerkClient } from '@clerk/nextjs/server'
import { verifyLineIdToken } from '@/lib/verifyLineIdToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) {
      return NextResponse.json({ error: 'idToken required' }, { status: 400 })
    }

    const claims = await verifyLineIdToken(idToken)
    const externalId = `line:${claims.sub}`

    // Core 2 returns { data, totalCount }
    const clerk = await getClerkClient()
    const { data: users } = await clerk.users.getUserList({
      externalId: [externalId],
      limit: 1,
    })

    const user =
      users[0] ??
      (await clerk.users.createUser({
        externalId,
        firstName: claims.name || undefined,
        emailAddress: claims.email ? [claims.email] : undefined,
      }))

    const { token } = await clerk.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 60,
    })

    return NextResponse.json({ ticket: token }, { status: 200 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
