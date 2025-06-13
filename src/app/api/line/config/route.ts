import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Dynamic imports
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { LineMessagingConfig } = await import('@/models/LineMessagingConfig');
    
    await dbConnect();
    
    const config = await LineMessagingConfig.findOne({ ownerId: userId });
    
    if (!config) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      exists: true,
      config: {
        channelId: config.channelId,
        isActive: config.isActive,
        webhookUrl: config.webhookUrl,
        hasAllowedUsers: config.allowedLineUserIds && config.allowedLineUserIds.length > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching LINE config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

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
    const { channelAccessToken, channelSecret, channelId, webhookUrl } = body;

    // 必須フィールドのチェック
    if (!channelAccessToken || !channelSecret || !channelId) {
      return NextResponse.json(
        { error: 'Channel access token, secret, and ID are required' },
        { status: 400 }
      );
    }

    // Dynamic imports
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { LineMessagingConfig } = await import('@/models/LineMessagingConfig');
    
    await dbConnect();
    
    // 設定を作成または更新
    const config = await LineMessagingConfig.findOneAndUpdate(
      { ownerId: userId },
      {
        channelAccessToken,
        channelSecret,
        channelId,
        webhookUrl,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'LINE Messaging configuration saved',
      configId: config._id,
    });
  } catch (error) {
    console.error('Error saving LINE config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Dynamic imports
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { LineMessagingConfig } = await import('@/models/LineMessagingConfig');
    
    await dbConnect();
    
    await LineMessagingConfig.findOneAndDelete({ ownerId: userId });
    
    return NextResponse.json({
      success: true,
      message: 'LINE Messaging configuration deleted',
    });
  } catch (error) {
    console.error('Error deleting LINE config:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
}