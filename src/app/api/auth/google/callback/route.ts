import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CalendarTokenService } from '@/services/calendar-token-service';
import { routing } from '@/i18n/routing';

function detectLocale(request: NextRequest): string {
  const referer = request.headers.get('referer') || '';
  try {
    const url = new URL(referer);
    const [, maybeLocale] = url.pathname.split('/');
    if (routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
      return maybeLocale as string;
    }
  } catch {}
  return routing.defaultLocale;
}

export async function GET(request: NextRequest) {
  const locale = detectLocale(request);
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL(`/${locale}/signin`, request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // ownerId (Clerk User ID)
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/${locale}/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/${locale}/settings?error=missing_parameters`, request.url)
      );
    }

    // トークンを保存
    await CalendarTokenService.saveTokensFromCode(state, code);
    
    return NextResponse.redirect(
      new URL(`/${locale}/settings?success=google_connected`, request.url)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    
    return NextResponse.redirect(
      new URL(`/${locale}/settings?error=connection_failed`, request.url)
    );
  }
}
