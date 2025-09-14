import crypto from 'crypto'

export type InvitePayload = {
  orgId: string
  role: 'org:member' | 'org:admin'
  iat: number // seconds
  exp?: number // seconds
  v: 1
}

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function fromBase64url<T = unknown>(input: string): T {
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = input.length % 4
  if (pad) input = input + '='.repeat(4 - pad)
  const json = Buffer.from(input, 'base64').toString('utf8')
  return JSON.parse(json) as T
}

function getSecret(): Buffer {
  const secret = process.env.INVITE_LINK_SECRET
  if (!secret) {
    throw new Error('INVITE_LINK_SECRET is required (set in .env.local)')
  }
  return Buffer.from(secret, 'utf8')
}

export function signInvite(payload: Omit<InvitePayload, 'iat' | 'v'> & { expHours?: number }): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = payload.expHours && payload.expHours > 0 ? now + Math.floor(payload.expHours * 3600) : undefined
  const p: InvitePayload = { orgId: payload.orgId, role: payload.role, iat: now, v: 1, ...(exp ? { exp } : {}) }
  const body = base64url(JSON.stringify(p))
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest()
  const token = `${body}.${base64url(sig)}`
  return token
}

export function verifyInvite(token: string): InvitePayload {
  const [body, sig] = token.split('.')
  if (!body || !sig) throw new Error('Invalid token')
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest()
  const got = Buffer.from(sig.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  const ok = expected.length === got.length && crypto.timingSafeEqual(expected, got)
  if (!ok) throw new Error('Invalid signature')
  const payload = fromBase64url<InvitePayload>(body)
  if (payload.v !== 1) throw new Error('Unsupported token version')
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')
  return payload
}

