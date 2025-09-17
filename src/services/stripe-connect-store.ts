import { clerkClient } from '@clerk/nextjs/server';

const METADATA_KEY = 'stripeConnect';

function normalize(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Record<string, unknown>;
  const accountId = data.accountId;
  return typeof accountId === 'string' && accountId.length > 0 ? accountId : null;
}

export async function readStripeAccountId(userId: string): Promise<string | null> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.privateMetadata as Record<string, unknown> | null | undefined;
  if (!metadata) {
    return null;
  }
  return normalize(metadata[METADATA_KEY]);
}

export async function writeStripeAccountId(userId: string, accountId: string): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = (user.privateMetadata as Record<string, unknown> | null | undefined) ?? {};

  await client.users.updateUser(userId, {
    privateMetadata: {
      ...metadata,
      [METADATA_KEY]: { accountId },
    },
  });
}

export async function clearStripeAccountId(userId: string): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = { ...(user.privateMetadata as Record<string, unknown> | null | undefined) };
  if (!metadata[METADATA_KEY]) {
    return;
  }

  delete metadata[METADATA_KEY];

  await client.users.updateUser(userId, {
    privateMetadata: metadata,
  });
}
