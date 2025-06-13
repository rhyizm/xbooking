import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { LineMessagingService } from '@/lib/line-messaging-service';

// LINE Webhook Event Types
interface MessageEvent {
  type: 'message';
  replyToken: string;
  source: {
    userId: string;
    type: 'user';
  };
  timestamp: number;
  message: {
    id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'location' | 'sticker';
    text?: string;
  };
}

interface FollowEvent {
  type: 'follow';
  replyToken: string;
  source: {
    userId: string;
    type: 'user';
  };
  timestamp: number;
}

interface UnfollowEvent {
  type: 'unfollow';
  source: {
    userId: string;
    type: 'user';
  };
  timestamp: number;
}

type WebhookEvent = MessageEvent | FollowEvent | UnfollowEvent;

interface WebhookBody {
  destination: string; // Bot's user ID
  events: WebhookEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-line-signature');
    const body = await request.text();
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Dynamic imports
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { LineMessagingConfig } = await import('@/models/LineMessagingConfig');
    const { LineMessagingService } = await import('@/lib/line-messaging-service');
    
    await dbConnect();
    
    const webhookData: WebhookBody = JSON.parse(body);
    
    // Botの設定を取得（Bot User IDから逆引き）
    // 注意: 実際の実装では、Bot User IDとownerIdの関連付けが必要
    // ここでは簡略化のため、最初に見つかった設定を使用
    const config = await LineMessagingConfig.findOne({ isActive: true });
    
    if (!config) {
      console.error('No active LINE Messaging config found');
      return NextResponse.json({ success: true });
    }
    
    // 署名を検証
    const hash = crypto
      .createHmac('sha256', config.channelSecret)
      .update(body)
      .digest('base64');
    
    if (hash !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const lineService = new LineMessagingService(config.channelAccessToken);
    
    // 各イベントを処理
    for (const event of webhookData.events) {
      switch (event.type) {
        case 'follow':
          await handleFollowEvent(event as FollowEvent, config.ownerId, lineService);
          break;
          
        case 'unfollow':
          await handleUnfollowEvent(event as UnfollowEvent, config.ownerId);
          break;
          
        case 'message':
          await handleMessageEvent(event as MessageEvent, config.ownerId, lineService);
          break;
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleFollowEvent(
  event: FollowEvent,
  ownerId: string,
  lineService: LineMessagingService
) {
  try {
    // ユーザープロファイルを取得
    const profile = await lineService.getUserProfile(event.source.userId);
    
    // Dynamic import
    const { LineUser } = await import('@/models/LineUser');
    
    // ユーザー情報を保存または更新
    await LineUser.findOneAndUpdate(
      { ownerId, lineUserId: event.source.userId },
      {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
        isFollowing: true,
        followedAt: new Date(),
        unfollowedAt: undefined,
      },
      { upsert: true }
    );
    
    // ウェルカムメッセージを送信
    await lineService.pushMessage(event.source.userId, [
      {
        type: 'text',
        text: `${profile.displayName}さん、友だち追加ありがとうございます！🎉`,
      },
    ]);
    
    console.log(`User ${profile.displayName} (${event.source.userId}) followed the bot`);
  } catch (error) {
    console.error('Error handling follow event:', error);
  }
}

async function handleUnfollowEvent(event: UnfollowEvent, ownerId: string) {
  try {
    // Dynamic import
    const { LineUser } = await import('@/models/LineUser');
    
    // ユーザーのフォロー状態を更新
    await LineUser.findOneAndUpdate(
      { ownerId, lineUserId: event.source.userId },
      {
        isFollowing: false,
        unfollowedAt: new Date(),
      }
    );
    
    console.log(`User ${event.source.userId} unfollowed the bot`);
  } catch (error) {
    console.error('Error handling unfollow event:', error);
  }
}

async function handleMessageEvent(
  event: MessageEvent,
  ownerId: string,
  lineService: LineMessagingService
) {
  try {
    // メッセージの種類に応じて処理
    if (event.message.type === 'text') {
      const messageText = event.message.text || '';
      
      // 簡単な自動応答の例
      if (messageText.toLowerCase().includes('hello') || messageText.includes('こんにちは')) {
        await lineService.pushMessage(event.source.userId, [
          {
            type: 'text',
            text: 'こんにちは！何かお手伝いできることはありますか？',
          },
        ]);
      }
    }
    
    console.log(`Received message from ${event.source.userId}: ${event.message.type}`);
  } catch (error) {
    console.error('Error handling message event:', error);
  }
}