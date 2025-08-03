// src/app/api/stripe/connect/account/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import StripeAccount from '@/models/StripeAccount';
import dbConnect from '@/lib/mongodb';
import stripe from "@/lib/stripe/server";

/**
 * 認証済みマーチャントの Stripe Connect アカウントを作成する。
 *
 * 1. Clerk で認証とロール（merchant）を検証  
 * 2. リクエストボディから `type` を取得（省略時は `express`）  
 * 3. 既存アカウントの有無を MongoDB で確認  
 * 4. Stripe で Connect Account を作成  
 * 5. 生成したアカウント情報を MongoDB に保存  
 *
 * ### HTTP ステータス
 * - **200**: 作成成功  
 * - **400**: 既にアカウントが存在  
 * - **401**: 未認証  
 * - **403**: merchant ロールではない  
 * - **500**: 予期しないエラー  
 *
 * @param req - `NextRequest` オブジェクト
 * @returns `NextResponse`  
 * ```json
 * // 成功時
 * { "accountId": "acct_123", "onboardingCompleted": false }
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
        error: 'Only merchants can create Stripe Connect accounts' 
      }, { status: 403 });
    }

    // リクエストボディからtypeを取得（デフォルトはexpress）
    let accountType: 'express' | 'standard' = 'express';
    try {
      const body = await req.json();
      if (body.type === 'standard') {
        accountType = 'standard';
      }
    } catch {
      // ボディが空の場合はデフォルトのexpressを使用
    }

    await dbConnect();

    // 既存のStripeアカウントをチェック
    const existingAccount = await StripeAccount.findOne({ ownerId: userId });
    if (existingAccount) {
      return NextResponse.json({ 
        error: 'Stripe account already exists',
        accountId: existingAccount.stripeAccountId 
      }, { status: 400 });
    }

    // Stripe Connect Accountを作成
    const account = await stripe.accounts.create({
      type: accountType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      email: user.emailAddresses[0]?.emailAddress,
    });

    // データベースに保存
    const stripeAccount = new StripeAccount({
      ownerId: userId,
      stripeAccountId: account.id,
      accountType: accountType,
      onboardingCompleted: false,
      accountEnabled: false,
      merchantEmail: user.emailAddresses[0]?.emailAddress,
    });
    
    await stripeAccount.save();

    return NextResponse.json({
      accountId: account.id,
      onboardingCompleted: false,
    });

  } catch (error) {
    console.error('Error creating Stripe account:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe account' },
      { status: 500 }
    );
  }
}

/**
 * 認証済みユーザーの Stripe Connect アカウント情報を取得する。
 *
 * 1. Clerk で認証  
 * 2. MongoDB でアカウント情報を検索  
 * 3. 存在する場合は Stripe API で最新状態を取得し、  
 *    `onboardingCompleted`, `accountEnabled` を更新  
 *
 * ### HTTP ステータス
 * - **200**: 取得成功  
 * - **401**: 未認証  
 * - **500**: 予期しないエラー  
 *
 * @returns `NextResponse`  
 * ```json
 * // アカウントが存在する場合
 * {
 *   "accountExists": true,
 *   "accountId": "acct_123",
 *   "onboardingCompleted": true,
 *   "accountEnabled": true
 * }
 * // アカウントが存在しない場合
 * { "accountExists": false }
 * ```
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await dbConnect();
      const stripeAccount = await StripeAccount.findOne({ ownerId: userId });
      
      if (!stripeAccount) {
        return NextResponse.json({ 
          accountExists: false 
        });
      }

      // Stripeから最新の情報を取得
      const account = await stripe.accounts.retrieve(stripeAccount.stripeAccountId);
      
      // オンボーディング状況を更新
      const onboardingCompleted = account.details_submitted || false;
      const accountEnabled = account.charges_enabled || false;

      if (stripeAccount.onboardingCompleted !== onboardingCompleted || 
          stripeAccount.accountEnabled !== accountEnabled) {
        await StripeAccount.findByIdAndUpdate(stripeAccount._id, {
          onboardingCompleted,
          accountEnabled,
        });
      }

      return NextResponse.json({
        accountExists: true,
        accountId: stripeAccount.stripeAccountId,
        onboardingCompleted,
        accountEnabled,
      });
    } catch (dbError) {
      console.warn('Database connection failed, returning default response:', dbError);
      // MongoDBに接続できない場合でも、アカウントが存在しないとして返す
      return NextResponse.json({ 
        accountExists: false 
      });
    }

  } catch (error) {
    console.error('Error fetching Stripe account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe account' },
      { status: 500 }
    );
  }
}