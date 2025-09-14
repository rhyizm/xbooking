// src/lib/verifyLineIdToken.ts
export type LineClaims = {
  iss: string;
  aud: string;
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
  exp: number;
  iat: number;
};

export async function verifyLineIdToken(idToken: string): Promise<LineClaims> {
  if (!process.env.LINE_CHANNEL_ID) {
    throw new Error('LINE_CHANNEL_ID is not set')
  }

  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: process.env.LINE_CHANNEL_ID!,
    }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('LINE verify failed');
  const claims = (await res.json()) as LineClaims;

  if (claims.iss !== 'https://access.line.me') throw new Error('iss mismatch');
  if (claims.aud !== process.env.LINE_CHANNEL_ID) throw new Error('aud mismatch');
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp <= now) throw new Error('token expired');

  return claims;
}
