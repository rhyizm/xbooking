// src/app/api/stripe/connect/onboarding/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import StripeAccount from '@/models/StripeAccount';
import dbConnect from '@/lib/mongodb';
import stripe from "@/lib/stripe/server";
import { routing } from '@/i18n/routing';

function detectLocale(req: NextRequest): string {
  const referer = req.headers.get('referer') || '';
  try {
    const url = new URL(referer);
    const [, maybeLocale] = url.pathname.split('/');
    if (routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
      return maybeLocale as string;
    }
  } catch {}
  return routing.defaultLocale;
}

/**
 * Stripe Connect オンボーディング用の AccountLink を発行する。
 *
 * 1. Clerk で認証と merchant ロールを検証  
 * 2. MongoDB でユーザーの StripeAccount を取得（存在しなければ 404）  
 * 3. Stripe API で `account_onboarding` 用の AccountLink を生成  
 *
 * ### HTTP ステータス
 * - **200**: 発行成功  
 * - **401**: 未認証  
 * - **403**: merchant ロールではない  
 * - **404**: Stripe アカウント未作成  
 * - **500**: 予期しないエラー  
 *
 * @param req - `NextRequest` オブジェクト
 * @returns `NextResponse`
 * ```json
 * // 成功時
 * { "url": "https://connect.stripe.com/..." }
 * // エラー時
 * { "error": "説明" }
 * ```
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // merchant役割の確認
    const user = await currentUser();
    if (!user || user.unsafeMetadata?.role !== 'merchant') {
      return NextResponse.json({ 
        error: 'Only merchants can access Stripe Connect onboarding' 
      }, { status: 403 });
    }

    await dbConnect();

    const stripeAccount = await StripeAccount.findOne({ ownerId: userId });
    
    if (!stripeAccount) {
      return NextResponse.json({ 
        error: 'Stripe account not found. Please create an account first.' 
      }, { status: 404 });
    }

    // オンボーディング用のAccountLinkを作成
    const locale = detectLocale(req);
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/settings?stripe_refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/settings?stripe_onboarding=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
    });

  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
