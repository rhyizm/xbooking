// src/app/api/clerk/organizations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

type CreateOrganizationBody = {
  name?: unknown;
  slug?: unknown;
};

/**
 * Create a Clerk Organization for the authenticated user.
 *
 * Request
 * - POST /api/clerk/organizations
 * - Body: { name: string; slug?: string }
 *
 * Responses
 * - 201: { id, name, slug }
 * - 400: invalid request body
 * - 401: not authenticated
 * - 409: slug conflict or validation error returned from Clerk
 * - 500: unexpected error
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: CreateOrganizationBody = {};
    try {
      body = await req.json();
    } catch {
      // no-op; treat as empty body
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slugRaw = typeof body.slug === 'string' ? body.slug.trim() : undefined;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Basic slug normalization/validation (optional, Clerk also validates)
    let slug: string | undefined = undefined;
    if (slugRaw) {
      const normalized = slugRaw.toLowerCase();
      if (!/^[a-z0-9-]{2,50}$/.test(normalized)) {
        return NextResponse.json(
          { error: 'Invalid slug format. Use 2-50 chars: a-z, 0-9, -' },
          { status: 400 }
        );
      }
      slug = normalized;
    }

    const client = await clerkClient();

    try {
      const organization = await client.organizations.createOrganization({
        name,
        ...(slug ? { slug } : {}),
        createdBy: userId,
      });

      return NextResponse.json(
        {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        { status: 201 }
      );
    } catch (err: unknown) {
      // Attempt to map Clerk validation errors to 409/400
      type ClerkAPIError = { errors?: { code?: string; message?: string }[]; message?: string };
      const e = err as ClerkAPIError;
      const message = e?.errors?.[0]?.message || e?.message || 'Failed to create organization';
      const code = e?.errors?.[0]?.code as string | undefined;
      if (code === 'form_param_format_invalid' || code === 'form_identifier_not_allowed') {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      if (code === 'form_identifier_exists' || message.toLowerCase().includes('already taken')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      console.error('Clerk createOrganization error:', err);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error creating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
