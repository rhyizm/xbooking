import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, unsafe_metadata } = evt.data;
    
    if (unsafe_metadata?.role === 'merchant') {
      try {
        const orgName = `${first_name || ''} ${last_name || ''}`.trim() || 
                       email_addresses[0]?.email_address?.split('@')[0] || 
                       'My Organization';
        
        const client = await clerkClient();
        const organization = await client.organizations.createOrganization({
          name: orgName,
          createdBy: id,
        });

        await client.organizations.createOrganizationMembership({
          organizationId: organization.id,
          userId: id,
          role: 'admin'
        });

        console.log(`Created organization for merchant user: ${id}, org: ${organization.id}`);
      } catch (error) {
        console.error('Error creating organization for merchant:', error);
      }
    }
  }

  return new Response('', { status: 200 });
}