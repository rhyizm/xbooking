import { google } from 'googleapis';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export class OAuthTokenManager {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // 認証URLを生成
  generateAuthUrl(ownerId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // リフレッシュトークンを取得
      scope: scopes,
      state: ownerId, // ユーザーIDを状態として保存
      prompt: 'consent', // 常に同意画面を表示（リフレッシュトークンを確実に取得）
    });
  }

  // 認証コードをトークンに交換
  async getTokensFromCode(code: string): Promise<TokenData> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date!,
    };
  }

  // トークンをリフレッシュ
  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiryDate: credentials.expiry_date!,
    };
  }

  // カレンダーAPIクライアントを取得
  getCalendarClient(accessToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    });

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }
}