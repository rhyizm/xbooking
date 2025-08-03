import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

// i18n 設定
const locales = ['en', 'ja', 'fr'] as const;
const defaultLocale = 'en';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

// 公開ルート（認証不要）のマッチャーを作成
const isPublicRoute = createRouteMatcher([
  '/',
  '/signin(.*)', 
  '/signup(.*)',
  '/api/dummy(.*)'
]);

// 認証が必要だがi18nを適用しないAPIルート
const isAuthenticatedApiRoute = createRouteMatcher([
  '/api/stripe(.*)'
]);

// i18nとClerkを組み合わせたミドルウェア
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  
  // パスからロケールを抽出
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // ロケールを除いたパスを取得
  let pathWithoutLocale = pathname;
  if (pathnameHasLocale) {
    const segments = pathname.split('/');
    segments.splice(1, 1); // ロケールを削除
    pathWithoutLocale = segments.join('/') || '/';
  }
  
  // 認証状態を取得
  const { userId } = await auth();
  
  // 認証済みユーザーがsignin/signupページにアクセスした場合、ダッシュボードにリダイレクト
  if (userId && (pathWithoutLocale.includes('/signin') || pathWithoutLocale.includes('/signup'))) {
    const url = req.nextUrl.clone();
    const locale = pathnameHasLocale ? pathname.split('/')[1] : defaultLocale;
    url.pathname = locale === defaultLocale ? '/dashboard' : `/${locale}/dashboard`;
    return Response.redirect(url);
  }
  
  // APIルートの場合、i18nを適用しない
  if (pathname.startsWith('/api/')) {
    // 認証が必要なAPIルートの場合
    if (isAuthenticatedApiRoute(req) && !userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    // APIルートはi18nミドルウェアをスキップ
    return;
  }
  
  // 公開ルートでない場合は認証を要求
  if (!isPublicRoute({ nextUrl: { pathname: pathWithoutLocale } } as Parameters<typeof isPublicRoute>[0])) {
    if (!userId) {
      await auth.protect();
    }
  }
  
  // i18n routingを処理
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};