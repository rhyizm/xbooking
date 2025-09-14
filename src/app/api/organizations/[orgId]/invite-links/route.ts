import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { signInvite } from '@/lib/inviteToken'

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { orgId } = await params;
    const body = await req.json().catch(() => ({}));
    const role: 'org:member' | 'org:admin' = body?.role === 'org:admin' ? 'org:admin' : 'org:member';
    const ttlHours: number | undefined = body?.ttlHours ? Number(body.ttlHours) : undefined; // optional
    const locale: string | undefined = body?.locale; // optional

    const clerk = await clerkClient();
    const memberships = await clerk.users.getOrganizationMembershipList({ userId });
    const membership = memberships.data.find(m => m.organization.id === orgId);
    if (!membership || membership.role !== 'org:admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const token = signInvite({ orgId, role, expHours: ttlHours });

    const url = new URL(req.url);
    const originFromEnv = process.env.NEXT_PUBLIC_BASE_URL;
    const origin = originFromEnv && originFromEnv.length > 0 ? originFromEnv : `${url.origin}`;
    const path = locale ? `/${locale}/organizations/${orgId}/invites` : `/organizations/${orgId}/invites`;
    const inviteUrl = `${origin}${path}?token=${encodeURIComponent(token)}`;

    return Response.json({ success: true, inviteUrl, role, ttlHours: ttlHours ?? null }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to create invite link:', err);
    const message = err instanceof Error && err.message ? err.message : 'Internal Server Error';
    return Response.json({ error: message }, { status: 500 });
  }
}
