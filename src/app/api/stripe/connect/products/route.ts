import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import type Stripe from 'stripe';
import getStripeClient from '@/lib/stripe/server';
import { readStripeAccountId } from '@/services/stripe-connect-store';

type ApiProduct = {
  _id: string;
  name: string;
  kind: 'event' | 'gym';
  stripeProductId: string;
  prices: ApiPrice[];
};

type ApiPrice = {
  _id: string;
  stripePriceId: string;
  label?: string;
  currency: string;
  unitAmount?: number | null;
  usageType: 'licensed' | 'metered' | 'one_time';
  tiers?: { up_to: number | 'inf'; unit_amount: number | null }[];
};

function usageTypeFromPrice(price: Stripe.Price): ApiPrice['usageType'] {
  if (price.recurring?.usage_type === 'metered') return 'metered';
  if (price.type === 'recurring') return 'licensed';
  return 'one_time';
}

function toApiPrice(price: Stripe.Price): ApiPrice {
  return {
    _id: price.id,
    stripePriceId: price.id,
    label: (price.metadata?.label as string) || price.nickname || undefined,
    currency: price.currency,
    unitAmount: price.unit_amount,
    usageType: usageTypeFromPrice(price),
    tiers: price.tiers?.map((tier) => ({
      up_to: tier.up_to as number | 'inf',
      unit_amount: tier.unit_amount ?? null,
    })),
  };
}

function toApiProduct(product: Stripe.Product, prices: Stripe.ApiList<Stripe.Price>): ApiProduct {
  const kind = (product.metadata?.kind as 'event' | 'gym') || 'event';
  return {
    _id: product.id,
    name: product.name,
    kind,
    stripeProductId: product.id,
    prices: prices.data.map(toApiPrice),
  };
}

async function requireStripeAccount(userId: string) {
  const accountId = await readStripeAccountId(userId);
  if (!accountId) {
    return { error: 'Stripe Connect account not found', status: 400 } as const;
  }
  return { accountId } as const;
}

async function fetchAccount(stripe: Stripe, accountId: string) {
  try {
    return await stripe.accounts.retrieve(accountId);
  } catch (error) {
    console.error('Failed to retrieve Stripe account', error);
    return null;
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await readStripeAccountId(userId);
    if (!accountId) {
      return NextResponse.json({ items: [] });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const account = await fetchAccount(stripe, accountId);
    if (!account) {
      return NextResponse.json({ error: 'Failed to fetch Stripe account' }, { status: 500 });
    }

    if (!account.details_submitted) {
      return NextResponse.json({ items: [] });
    }

    const requestOptions: Stripe.RequestOptions = {
      stripeAccount: accountId,
    };

    const products = await stripe.products.list({ limit: 50 }, requestOptions);
    const items: ApiProduct[] = [];

    for (const product of products.data) {
      const prices = await stripe.prices.list({ product: product.id, limit: 100 }, requestOptions);
      items.push(toApiProduct(product, prices));
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('List products failed', error);
    return NextResponse.json({ error: 'Failed to list products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user || user.unsafeMetadata?.role !== 'merchant') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const result = await requireStripeAccount(userId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const { accountId } = result;

    const account = await fetchAccount(stripe, accountId);
    if (!account) {
      return NextResponse.json({ error: 'Failed to fetch Stripe account' }, { status: 500 });
    }

    if (!account.details_submitted) {
      return NextResponse.json({ error: 'Complete Stripe Connect onboarding before creating products' }, { status: 400 });
    }

    const body = await req.json();

    if (body.kind === 'event') {
      if (!Array.isArray(body.prices) || body.prices.length === 0) {
        return NextResponse.json({ error: 'At least one price is required' }, { status: 400 });
      }
      for (const price of body.prices) {
        if (!price.currency || typeof price.amount !== 'number') {
          return NextResponse.json({ error: 'Invalid event price input' }, { status: 400 });
        }
      }
    } else if (body.kind === 'gym') {
      if (!body.plan || typeof body.plan.baseAmount !== 'number' || !body.plan.currency) {
        return NextResponse.json({ error: 'Invalid gym plan input' }, { status: 400 });
      }
      if (body.plan.enableMetered) {
        if (
          typeof body.plan.includedVisits !== 'number' ||
          typeof body.plan.overageAmount !== 'number'
        ) {
          return NextResponse.json({ error: 'Metered plan requires includedVisits and overageAmount' }, { status: 400 });
        }
      }
    } else {
      return NextResponse.json({ error: 'Unknown product kind' }, { status: 400 });
    }

    const requestOptions: Stripe.RequestOptions = {
      stripeAccount: accountId,
    };

    const product = await stripe.products.create(
      {
        name: body.name,
        metadata: { kind: body.kind },
      },
      requestOptions,
    );

    const createdPrices: Stripe.Price[] = [];

    if (body.kind === 'event') {
      for (const price of body.prices as Array<{ label: string; currency: string; amount: number }>) {
        const stripePrice = await stripe.prices.create(
          {
            product: product.id,
            currency: price.currency,
            unit_amount: price.amount,
            nickname: price.label,
            metadata: { label: price.label },
          },
          requestOptions,
        );
        createdPrices.push(stripePrice);
      }
    } else if (body.kind === 'gym') {
      const basePrice = await stripe.prices.create(
        {
          product: product.id,
          currency: body.plan.currency,
          unit_amount: body.plan.baseAmount,
          recurring: { interval: 'month', usage_type: 'licensed' },
          nickname: 'base',
          metadata: { label: 'base' },
        },
        requestOptions,
      );
      createdPrices.push(basePrice);

      if (body.plan.enableMetered) {
        const tiers: Stripe.PriceCreateParams.Tier[] = [
          { up_to: body.plan.includedVisits, unit_amount: 0 },
          { up_to: 'inf', unit_amount: body.plan.overageAmount },
        ];
        const metered = await stripe.prices.create(
          {
            product: product.id,
            currency: body.plan.currency,
            recurring: { interval: 'month', usage_type: 'metered' },
            billing_scheme: 'tiered',
            tiers_mode: 'graduated',
            tiers,
            nickname: 'metered',
            metadata: {
              label: 'metered',
              included_visits: String(body.plan.includedVisits),
              overage_amount: String(body.plan.overageAmount),
            },
          },
          requestOptions,
        );
        createdPrices.push(metered);
      }
    }

    const pricesList = { data: createdPrices } as Stripe.ApiList<Stripe.Price>;
    const apiProduct = toApiProduct(product, pricesList);

    return NextResponse.json({ product: apiProduct });
  } catch (error) {
    console.error('Create product failed', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
