import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import StripeAccount from '@/models/StripeAccount';
import dbConnect from '@/lib/mongodb';
import stripe from "@/lib/stripe/server";

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

    await dbConnect();

    const stripeAccount = await StripeAccount.findOne({ ownerId: userId });
    
    if (!stripeAccount) {
      return NextResponse.json({ 
        error: 'Stripe account not found. Please create an account first.' 
      }, { status: 404 });
    }

    // Express Dashboardへのログインリンクを作成
    const loginLink = await stripe.accounts.createLoginLink(stripeAccount.stripeAccountId);

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
