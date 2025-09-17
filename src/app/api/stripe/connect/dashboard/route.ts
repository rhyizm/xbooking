import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import getStripeClient from '@/lib/stripe/server';
import { readStripeAccountId } from '@/services/stripe-connect-store';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // merchant役割の確認
    const user = await currentUser();
    if (!user || user.unsafeMetadata?.role !== 'merchant') {
      return NextResponse.json({ 
        error: 'Only merchants can access Stripe dashboard' 
      }, { status: 403 });
    }

    const stripeAccountId = await readStripeAccountId(userId);

    if (!stripeAccountId) {
      return NextResponse.json({ 
        error: 'Stripe account not found. Please create an account first.' 
      }, { status: 404 });
    }

    // Express Dashboardへのログインリンクを作成
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    return NextResponse.json({
      url: loginLink.url,
    });

  } catch (error) {
    console.error('Error creating dashboard link:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard link' },
      { status: 500 }
    );
  }
}
