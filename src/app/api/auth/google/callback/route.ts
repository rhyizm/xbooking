import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CalendarTokenService } from '@/services/calendar-token-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // ownerId (Clerk User ID)
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=missing_parameters', request.url)
      );
    }

    // トークンを保存
    await CalendarTokenService.saveTokensFromCode(state, code);
    
    return NextResponse.redirect(
      new URL('/settings?success=google_connected', request.url)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    
    return NextResponse.redirect(
      new URL('/settings?error=connection_failed', request.url)
    );
  }
}