import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { LineMessagingService } from '@/lib/line-messaging-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ lineUserId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lineUserId } = await context.params;

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
    
    // ユーザープロファイルを取得
    const profile = await lineService.getUserProfile(lineUserId);
    
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error fetching LINE profile:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}