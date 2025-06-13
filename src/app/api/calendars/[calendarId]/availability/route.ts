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
    const date = searchParams.get('date');
    const duration = searchParams.get('duration');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    // 指定日の空き時間を取得
    const availability = await CalendarService.getCalendarAvailability(
      calendarId,
      date,
      tenantId,
      duration ? parseInt(duration) : 60
    );
    
    return NextResponse.json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    
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
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch calendar availability' },
      { status: 500 }
    );
  }
}