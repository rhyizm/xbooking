import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { LineMessagingService } from '@/lib/line-messaging-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, messages, type = 'push' } = body;

    // 必須パラメータのチェック
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Dynamic imports
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { LineMessagingConfig } = await import('@/models/LineMessagingConfig');
    
    await dbConnect();
    
    // ユーザーのLINE Messaging設定を取得
    const config = await LineMessagingConfig.findOne({ 
      ownerId: userId,
      isActive: true 
    });
    
    if (!config) {
      return NextResponse.json(
        { error: 'LINE Messaging not configured or inactive' },
        { status: 404 }
      );
    }

    // LINE Messaging Serviceを初期化
    const lineService = new LineMessagingService(config.channelAccessToken);
    
    // メッセージタイプに応じて送信
    switch (type) {
      case 'push':
        if (!to || typeof to !== 'string') {
          return NextResponse.json(
            { error: 'Recipient (to) is required for push messages' },
            { status: 400 }
          );
        }
        
        // 許可されたユーザーIDリストがある場合はチェック
        if (config.allowedLineUserIds && config.allowedLineUserIds.length > 0) {
          if (!config.allowedLineUserIds.includes(to)) {
            return NextResponse.json(
              { error: 'Recipient not in allowed list' },
              { status: 403 }
            );
          }
        }
        
        await lineService.pushMessage(to, messages);
        break;
        
      case 'multicast':
        if (!to || !Array.isArray(to) || to.length === 0) {
          return NextResponse.json(
            { error: 'Recipients array (to) is required for multicast messages' },
            { status: 400 }
          );
        }
        
        // 許可されたユーザーIDリストがある場合はフィルタリング
        let recipients = to;
        if (config.allowedLineUserIds && config.allowedLineUserIds.length > 0) {
          recipients = to.filter(id => config.allowedLineUserIds!.includes(id));
          if (recipients.length === 0) {
            return NextResponse.json(
              { error: 'No recipients in allowed list' },
              { status: 403 }
            );
          }
        }
        
        await lineService.multicastMessage(recipients, messages);
        break;
        
      case 'broadcast':
        await lineService.broadcastMessage(messages);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid message type. Use: push, multicast, or broadcast' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      type,
    });
  } catch (error) {
    console.error('Error sending LINE message:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}