// import dbConnect from '@/lib/mongodb'; // Dynamic import used instead
import { Calendar } from '@/models/Calendar';
import { TenantCalendar } from '@/models/TenantCalendar';
import { GoogleToken } from '@/models/GoogleToken';
import { OAuthTokenManager } from '@/lib/oauth-token-manager';
import mongoose from 'mongoose';
import { calendar_v3 } from 'googleapis';

const tokenManager = new OAuthTokenManager();

interface EventQueryOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

export class CalendarService {
  // カレンダー情報を取得（買い手向け）
  static async getCalendarForBuyer(calendarId: string, tenantId?: string | null) {
    const { default: dbConnect } = await import('@/lib/mongodb');
    await dbConnect();
    
    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      throw new Error('Calendar not found');
    }
    
    // パブリックカレンダーの場合はテナント確認不要
    if (calendar.isPublic) {
      return {
        id: calendar._id,
        name: calendar.name,
        description: calendar.description,
        isPublic: calendar.isPublic,
        showDetails: calendar.showDetails,
        timeZone: calendar.timeZone,
      };
    }
    
    // プライベートカレンダーの場合はテナントの権限確認
    if (!tenantId) {
      throw new Error('Calendar not accessible');
    }
    
    const tenantCalendar = await TenantCalendar.findOne({
      calendarId: new mongoose.Types.ObjectId(calendarId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive: true,
    });
    
    if (!tenantCalendar) {
      throw new Error('Tenant not authorized');
    }
    
    return {
      id: calendar._id,
      name: tenantCalendar.customSettings?.displayName || calendar.name,
      description: calendar.description,
      isPublic: calendar.isPublic,
      showDetails: calendar.showDetails,
      timeZone: calendar.timeZone,
      tenantSettings: tenantCalendar.customSettings,
      canBook: tenantCalendar.canBook,
    };
  }
  
  // カレンダーイベントを取得
  static async getCalendarEvents(calendarId: string, tenantId?: string | null, options: EventQueryOptions = {}) {
    const { default: dbConnect } = await import('@/lib/mongodb');
    await dbConnect();
    
    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      throw new Error('Calendar not found');
    }
    
    // アクセス権限確認
    await this.checkCalendarAccess(calendar, tenantId);
    
    // カレンダーオーナーのトークンを取得
    const accessToken = await this.getCalendarOwnerToken(calendar.ownerId);
    if (!accessToken) {
      throw new Error('Calendar owner not connected');
    }
    
    const calendarClient = tokenManager.getCalendarClient(accessToken);
    
    // Googleカレンダーからイベントを取得
    const events = await calendarClient.events.list({
      calendarId: calendar.googleCalendarId,
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax,
      maxResults: options.maxResults || 50,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    // 詳細を隠す設定の場合
    if (!calendar.showDetails) {
      return events.data.items?.map((event: calendar_v3.Schema$Event) => ({
        id: event.id,
        start: event.start,
        end: event.end,
        status: 'busy',
      }));
    }
    
    return events.data.items;
  }
  
  // カレンダーイベントを作成
  static async createCalendarEvent(calendarId: string, tenantId: string, eventData: calendar_v3.Schema$Event) {
    const { default: dbConnect } = await import('@/lib/mongodb');
    await dbConnect();
    
    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      throw new Error('Calendar not found');
    }
    
    // テナントの予約権限確認
    const tenantCalendar = await TenantCalendar.findOne({
      calendarId: new mongoose.Types.ObjectId(calendarId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive: true,
      canBook: true,
    });
    
    if (!tenantCalendar) {
      throw new Error('Booking not allowed');
    }
    
    // カレンダーオーナーのトークンを取得
    const accessToken = await this.getCalendarOwnerToken(calendar.ownerId);
    if (!accessToken) {
      throw new Error('Calendar owner not connected');
    }
    
    const calendarClient = tokenManager.getCalendarClient(accessToken);
    
    // Googleカレンダーにイベントを作成
    const event = await calendarClient.events.insert({
      calendarId: calendar.googleCalendarId,
      requestBody: eventData,
    });
    
    return event.data;
  }
  
  // カレンダーの空き時間を取得
  static async getCalendarAvailability(calendarId: string, date: string, tenantId?: string | null, duration: number = 60) {
    const { default: dbConnect } = await import('@/lib/mongodb');
    await dbConnect();
    
    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      throw new Error('Calendar not found');
    }
    
    // アクセス権限確認
    await this.checkCalendarAccess(calendar, tenantId);
    
    // テナント固有の設定を取得
    let workingHours = {
      enabled: true,
      start: '09:00',
      end: '18:00',
    };
    
    if (tenantId) {
      const tenantCalendar = await TenantCalendar.findOne({
        calendarId: new mongoose.Types.ObjectId(calendarId),
        tenantId: new mongoose.Types.ObjectId(tenantId),
        isActive: true,
      });
      
      if (tenantCalendar?.customSettings?.workingHours) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = dayNames[new Date(date).getDay()];
        const dayWorkingHours = tenantCalendar.customSettings.workingHours.get(dayOfWeek);
        if (dayWorkingHours) {
          workingHours = dayWorkingHours;
        }
      }
    }
    
    if (!workingHours.enabled) {
      return [];
    }
    
    // カレンダーオーナーのトークンを取得
    const accessToken = await this.getCalendarOwnerToken(calendar.ownerId);
    if (!accessToken) {
      throw new Error('Calendar owner not connected');
    }
    
    const calendarClient = tokenManager.getCalendarClient(accessToken);
    
    // 指定日の開始・終了時刻を計算
    const dateStart = new Date(`${date}T${workingHours.start}:00`);
    const dateEnd = new Date(`${date}T${workingHours.end}:00`);
    
    // FreeBusy情報を取得
    const freeBusy = await calendarClient.freebusy.query({
      requestBody: {
        timeMin: dateStart.toISOString(),
        timeMax: dateEnd.toISOString(),
        items: [{ id: calendar.googleCalendarId }],
      },
    });
    
    const busyTimes = freeBusy.data.calendars?.[calendar.googleCalendarId]?.busy || [];
    
    // 空き時間スロットを計算
    const formattedBusyTimes = busyTimes
      .filter(time => time.start && time.end)
      .map(time => ({ start: time.start!, end: time.end! }));
    
    const availableSlots = this.calculateAvailableSlots(
      dateStart,
      dateEnd,
      formattedBusyTimes,
      duration
    );
    
    return availableSlots;
  }
  
  // カレンダーアクセス権限確認
  private static async checkCalendarAccess(calendar: { _id: string; isPublic: boolean }, tenantId?: string | null) {
    if (calendar.isPublic) {
      return; // パブリックカレンダーはアクセス可能
    }
    
    if (!tenantId) {
      throw new Error('Calendar not accessible');
    }
    
    const tenantCalendar = await TenantCalendar.findOne({
      calendarId: calendar._id,
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive: true,
    });
    
    if (!tenantCalendar) {
      throw new Error('Tenant not authorized');
    }
  }
  
  // カレンダーオーナーのトークンを取得
  private static async getCalendarOwnerToken(ownerId: string): Promise<string | null> {
    const googleToken = await GoogleToken.findOne({
      ownerId: ownerId,
    });
    
    if (!googleToken) {
      return null;
    }
    
    // トークンの有効性確認とリフレッシュロジックを追加
    const now = new Date();
    const expiryDate = new Date(googleToken.expiryDate);
    
    if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
      // トークンをリフレッシュ
      try {
        const newTokens = await tokenManager.refreshAccessToken(googleToken.refreshToken);
        
        await GoogleToken.findByIdAndUpdate(googleToken._id, {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiryDate: new Date(newTokens.expiryDate),
        });
        
        return newTokens.accessToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }
    
    return googleToken.accessToken;
  }
  
  // 空き時間スロットを計算
  private static calculateAvailableSlots(
    startTime: Date,
    endTime: Date,
    busyTimes: { start: string; end: string }[],
    duration: number
  ): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];
    const slotDuration = duration * 60 * 1000; // ミリ秒に変換
    
    let currentTime = new Date(startTime);
    
    while (currentTime.getTime() + slotDuration <= endTime.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration);
      
      // このスロットがbusyTimeと重複していないかチェック
      const isAvailable = !busyTimes.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        
        return (
          (currentTime >= busyStart && currentTime < busyEnd) ||
          (slotEnd > busyStart && slotEnd <= busyEnd) ||
          (currentTime <= busyStart && slotEnd >= busyEnd)
        );
      });
      
      if (isAvailable) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
      
      // 次のスロット時間に進む（15分間隔）
      currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
    }
    
    return slots;
  }
}