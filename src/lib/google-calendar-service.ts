import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Service Account を使用したカレンダーアクセス
export class GoogleCalendarService {
  private auth: JWT;
  private calendar: ReturnType<typeof google.calendar>;

  constructor() {
    // Service Account の認証情報
    // これらの値は環境変数から取得する
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  // テナントのカレンダーを取得（カレンダーIDを指定）
  async getTenantCalendar(calendarId: string) {
    try {
      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items;
    } catch (error) {
      console.error('Error fetching calendar:', error);
      throw error;
    }
  }

  // カレンダーの空き時間を取得
  async getFreeBusy(calendarId: string, timeMin: Date, timeMax: Date) {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: calendarId }],
        },
      });

      return response.data.calendars?.[calendarId] || null;
    } catch (error) {
      console.error('Error fetching free/busy:', error);
      throw error;
    }
  }
}