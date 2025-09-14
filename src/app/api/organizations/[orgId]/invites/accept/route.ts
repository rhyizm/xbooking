import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { verifyInvite } from '@/lib/inviteToken'

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    const { orgId } = await params;
    const { token } = await req.json();
    if (!token) return Response.json({ error: 'token is required' }, { status: 400 });

    const payload = verifyInvite(token);
    if (payload.orgId !== orgId) {
      return Response.json({ error: 'Invite does not match organization' }, { status: 400 });
    }

    const clerk = await clerkClient();
    // If already a member, return success idempotently
    try {
      const existingMemberships = await clerk.users.getOrganizationMembershipList({ userId });
      const exists = existingMemberships.data.find(m => m.organization.id === orgId);
      if (exists) {
        return Response.json({ success: true, alreadyMember: true });
      }
    } catch {}

    // Add membership
    await clerk.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId,
      role: payload.role,
    });

    return Response.json({ success: true });
  } catch (err: unknown) {
    console.error('Failed to accept invite:', err);
    let message = 'Internal Server Error';
    if (err instanceof Error && err.message) message = err.message;
    else if (typeof err === 'object' && err !== null) {
      const e = err as { errors?: Array<{ message?: string }>; message?: string };
      if (e.errors?.[0]?.message) message = e.errors[0].message as string;
      else if (typeof e.message === 'string') message = e.message;
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
