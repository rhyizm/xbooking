// src/app/api/clerk/organizations/[organizationId]/route.ts

import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

type UpdateOrganizationBody = {
  name?: unknown;
  slug?: unknown;
};

/**
 * Update a Clerk Organization. Only organization admins can update.
 *
 * Request
 * - PATCH /api/clerk/organizations/:organizationId
 * - Body: { name?: string; slug?: string }
 *
 * Responses
 * - 200: { id, name, slug }
 * - 400: invalid request body
 * - 401: not authenticated
 * - 403: not an organization admin
 * - 404: organization not found
 * - 409: slug conflict or validation error from Clerk
 * - 500: unexpected error
 */
export async function PATCH(
  req: Request,
  context: unknown
) {
  const { params } = (context as { params: { organizationId: string } }) ?? { params: { organizationId: '' } };
  const organizationId = params.organizationId;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();

    // Ensure the organization exists (and fetch basic details)
    try {
      await client.organizations.getOrganization({ organizationId });
    } catch (err: unknown) {
      type ClerkAPIError = { errors?: { code?: string; message?: string }[]; message?: string };
      const e = err as ClerkAPIError;
      const code = e?.errors?.[0]?.code as string | undefined;
      if (code === 'resource_not_found') {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to load organization' }, { status: 500 });
    }

    // Check requester is an admin of this organization
    try {
      const memberships = await client.organizations.getOrganizationMembershipList({ organizationId });
      const me = memberships.data.find(m => m.publicUserData?.userId === userId);
      const role = me?.role;
      const isAdmin = role === 'admin' || role === 'org:admin';
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: requires organization admin' }, { status: 403 });
      }
    } catch (err) {
      console.error('Error checking organization membership:', err);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    // Parse and validate body
    let body: UpdateOrganizationBody = {};
    try {
      body = await req.json();
    } catch {
      // allow empty body
    }

    const updates: { name?: string; slug?: string } = {};

    if (typeof body.name !== 'undefined') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) {
        return NextResponse.json(
          { error: 'If provided, name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (typeof body.slug !== 'undefined') {
      const slugRaw = typeof body.slug === 'string' ? body.slug.trim() : '';
      const normalized = slugRaw.toLowerCase();
      if (!/^[a-z0-9-]{2,50}$/.test(normalized)) {
        return NextResponse.json(
          { error: 'Invalid slug format. Use 2-50 chars: a-z, 0-9, -' },
          { status: 400 }
        );
      }
      updates.slug = normalized;
    }

    if (!('name' in updates) && !('slug' in updates)) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    try {
      const updated = await client.organizations.updateOrganization(
        organizationId,
        { ...updates }
      );

      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
      });
    } catch (err: unknown) {
      type ClerkAPIError = { errors?: { code?: string; message?: string }[]; message?: string };
      const e = err as ClerkAPIError;
      const message = e?.errors?.[0]?.message || e?.message || 'Failed to update organization';
      const code = e?.errors?.[0]?.code as string | undefined;
      if (code === 'form_param_format_invalid' || code === 'form_identifier_not_allowed') {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      if (code === 'form_identifier_exists' || String(message).toLowerCase().includes('already taken')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      console.error('Clerk updateOrganization error:', err);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
