import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import type Stripe from 'stripe';
import getStripeClient from '@/lib/stripe/server';
import { readStripeAccountId, writeStripeAccountId } from '@/services/stripe-connect-store';

type AccountStatus = {
  accountExists: true;
  accountId: string;
  accountType: 'express' | 'standard';
  onboardingCompleted: boolean;
  accountEnabled: boolean;
};

type AccountResponse = AccountStatus | { accountExists: false };

function buildStatus(accountId: string, remote: Stripe.Account | null): AccountStatus {
  return {
    accountExists: true,
    accountId,
    accountType: remote?.type === 'standard' ? 'standard' : 'express',
    onboardingCompleted: Boolean(remote?.details_submitted),
    accountEnabled: Boolean(remote?.charges_enabled),
  };
}

export async function GET(): Promise<NextResponse<AccountResponse | { error: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' } as const, { status: 401 });
    }

    const accountId = await readStripeAccountId(userId);
    if (!accountId) {
      return NextResponse.json({ accountExists: false });
    }

    const stripe = getStripeClient();
    let remote: Stripe.Account | null = null;
    if (stripe) {
      try {
        remote = await stripe.accounts.retrieve(accountId);
      } catch (error) {
        console.error('Failed to retrieve Stripe account', error);
      }
    }

    return NextResponse.json(buildStatus(accountId, remote));
  } catch (error) {
    console.error('Stripe account status lookup failed', error);
    return NextResponse.json({ error: 'Failed to fetch Stripe account' } as const, { status: 500 });
  }
}

export async function POST(): Promise<NextResponse<AccountResponse | { error: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' } as const, { status: 401 });
    }

    const user = await currentUser();
    if (!user || user.unsafeMetadata?.role !== 'merchant') {
      return NextResponse.json({ error: 'Only merchants can create Stripe Connect accounts' } as const, { status: 403 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' } as const, { status: 500 });
    }

    const existingAccountId = await readStripeAccountId(userId);
    if (existingAccountId) {
      try {
        const remote = await stripe.accounts.retrieve(existingAccountId);
        return NextResponse.json(buildStatus(existingAccountId, remote));
      } catch (error) {
        console.error('Failed to retrieve existing Stripe account', error);
        return NextResponse.json(buildStatus(existingAccountId, null));
      }
    }

    const emailAddress = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? undefined;

    const createdAccount = await stripe.accounts.create({
      type: 'express',
      email: emailAddress,
      metadata: {
        ownerId: userId,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await writeStripeAccountId(userId, createdAccount.id);

    return NextResponse.json(buildStatus(createdAccount.id, createdAccount));
  } catch (error) {
    console.error('Stripe account creation failed', error);
    return NextResponse.json({ error: 'Failed to create Stripe account' } as const, { status: 500 });
  }
}
