import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { orgId } = await params;
    const body = await req.json();
    const email: string | undefined = body?.email;
    const role: string = body?.role || 'org:member';
    const locale: string | undefined = body?.locale; // optional, e.g., 'ja'

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const clerk = await clerkClient();

    // Ensure the requester is an admin of the target organization
    const memberships = await clerk.users.getOrganizationMembershipList({ userId });
    const membership = memberships.data.find(m => m.organization.id === orgId);
    if (!membership || membership.role !== 'org:admin') {
      return new Response('Forbidden', { status: 403 });
    }

    // Build redirect URL to our accept-invitation page (localized if requested)
    const url = new URL(req.url);
    const originFromEnv = process.env.NEXT_PUBLIC_BASE_URL;
    const origin = originFromEnv && originFromEnv.length > 0 ? originFromEnv : `${url.origin}`;
    const path = locale ? `/${locale}/accept-invitation` : '/accept-invitation';
    const redirectUrl = `${origin}${path}`;

    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      inviterUserId: userId,
      emailAddress: email,
      role,
      redirectUrl,
    });

    // Clerk sends an email with the invite link. Return basic info.
    return Response.json({ success: true, invitation }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to create organization invitation:', err);
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
