import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { routing } from '@/i18n/routing';
import getStripeClient from '@/lib/stripe/server';
import { readStripeAccountId } from '@/services/stripe-connect-store';

function detectLocale(req: NextRequest): string {
  const referer = req.headers.get('referer') || '';
  try {
    const url = new URL(referer);
    const [, maybeLocale] = url.pathname.split('/');
    if (routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
      return maybeLocale as string;
    }
  } catch {
    // ignore parse errors, fall back below
  }
  return routing.defaultLocale;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user || user.unsafeMetadata?.role !== 'merchant') {
      return NextResponse.json({
        error: 'Only merchants can access Stripe Connect onboarding',
      }, { status: 403 });
    }

    const accountId = await readStripeAccountId(userId);

    if (!accountId) {
      return NextResponse.json({
        error: 'Stripe account not found. Please create an account first.',
      }, { status: 404 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const locale = detectLocale(req);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const refreshUrl = `${normalizedBaseUrl}/${locale}/settings?stripe_onboarding=retry`;
    const returnUrl = `${normalizedBaseUrl}/${locale}/products?stripe_onboarding=complete`;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect onboarding link creation failed', error);
    return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
  }
}
