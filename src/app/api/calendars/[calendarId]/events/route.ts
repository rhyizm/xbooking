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
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const maxResults = searchParams.get('maxResults');
    
    // カレンダーイベントを取得
    const events = await CalendarService.getCalendarEvents(calendarId, tenantId, {
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || undefined,
      maxResults: maxResults ? parseInt(maxResults) : 50,
    });
    
    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    
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
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await context.params;
    const body = await request.json();
    const { tenantId, event } = body;
    
    // イベントを作成
    const createdEvent = await CalendarService.createCalendarEvent(calendarId, tenantId, event);
    
    return NextResponse.json({
      success: true,
      event: createdEvent,
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Calendar not found') {
        return NextResponse.json(
          { error: 'Calendar not found' },
          { status: 404 }
        );
      }
      
      if (error.message === 'Booking not allowed') {
        return NextResponse.json(
          { error: 'Booking is not allowed for this calendar' },
          { status: 403 }
        );
      }
      
      if (error.message === 'Tenant not authorized') {
        return NextResponse.json(
          { error: 'Tenant is not authorized to book this calendar' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}