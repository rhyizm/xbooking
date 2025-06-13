// import dbConnect from '@/lib/mongodb'; // Dynamic import used instead
import { Tenant } from '@/models/Tenant';
import { GoogleToken } from '@/models/GoogleToken';
import { CalendarSettings } from '@/models/CalendarSettings';
import { OAuthTokenManager } from '@/lib/oauth-token-manager';
import mongoose from 'mongoose';
import { calendar_v3 } from 'googleapis';

const tokenManager = new OAuthTokenManager();

export class CalendarTokenService {
  // ユーザーのトークンを取得（自動リフレッシュ付き）
  static async getValidAccessToken(ownerId: string): Promise<string | null> {
    const { default: dbConnect } = await import('@/lib/mongodb');
    await dbConnect();
    
    const tokenData = await GoogleToken.findOne({ ownerId: ownerId });

    if (!tokenData) {
      return null;
    }

    // トークンの有効期限をチェック
    const now = new Date();
    const expiryDate = new Date(tokenData.expiryDate);
    
    // 有効期限の5分前にリフレッシュ
    const shouldRefresh = expiryDate.getTime() - now.getTime() < 5 * 60 * 1000;

    if (shouldRefresh) {
      try {
        // トークンをリフレッシュ
        const newTokens = await tokenManager.refreshAccessToken(tokenData.refreshToken);
        
        // データベースを更新
        await GoogleToken.findOneAndUpdate(
          { ownerId: ownerId },
          {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiryDate: new Date(newTokens.expiryDate),
          }
        );

        return newTokens.accessToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // リフレッシュに失敗した場合は、店舗オーナーに再認証を要求
        await GoogleToken.findOneAndDelete({ ownerId: ownerId });
        return null;
      }
    }

    return tokenData.accessToken;
  }

  // 認証コードからトークンを保存
  static async saveTokensFromCode(ownerId: string, code: string) {
    const { default: dbConnect } = await import('@/lib/mongodb');
    await dbConnect();
    
    const tokens = await tokenManager.getTokensFromCode(code);
    
    await GoogleToken.findOneAndUpdate(
      { ownerId: ownerId },
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: new Date(tokens.expiryDate),
      },
      { upsert: true, new: true }
    );
  }

  // テナントのカレンダーを取得（買い手向け）
  static async getTenantCalendarForBuyer(tenantId: string) {
    const accessToken = await this.getValidAccessToken(tenantId);
    
    if (!accessToken) {
      throw new Error('Tenant calendar not connected');
    }

    const tenant = await Tenant.findById(tenantId);
    const calendarSettings = await CalendarSettings.findOne({ tenantId: new mongoose.Types.ObjectId(tenantId) });

    if (!tenant?.googleCalendarId || !calendarSettings?.isPublic) {
      throw new Error('Calendar not available');
    }

    const calendarClient = tokenManager.getCalendarClient(accessToken);
    
    // カレンダーイベントを取得
    const events = await calendarClient.events.list({
      calendarId: tenant.googleCalendarId,
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    // 詳細を隠す設定の場合
    if (!calendarSettings.showDetails) {
      return events.data.items?.map((event: calendar_v3.Schema$Event) => ({
        id: event.id,
        start: event.start,
        end: event.end,
        status: 'busy',
      }));
    }

    return events.data.items;
  }
}
