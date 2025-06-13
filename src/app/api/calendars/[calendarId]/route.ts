import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendar-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    
    // カレンダーとテナントの関連性を確認してカレンダー情報を取得
    const calendarData = await CalendarService.getCalendarForBuyer(calendarId, tenantId);
    
    return NextResponse.json({
      success: true,
      calendar: calendarData,
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Calendar not found') {
        return NextResponse.json(
          { error: 'Calendar not found' },
          { status: 404 }
        );
      }
      
      if (error.message === 'Calendar not accessible') {
        return NextResponse.json(
          { error: 'This calendar is not publicly accessible' },
          { status: 403 }
        );
      }
      
      if (error.message === 'Tenant not authorized') {
        return NextResponse.json(
          { error: 'Tenant is not authorized to access this calendar' },
          { status: 403 }
        );
      }
      
      if (error.message === 'Calendar owner not connected') {
        return NextResponse.json(
          { error: 'Calendar owner has not connected their Google account' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}