import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const isFollowing = searchParams.get('following');
    const tags = searchParams.get('tags')?.split(',');

    // Dynamic imports
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { LineUser } = await import('@/models/LineUser');
    
    await dbConnect();
    
    // クエリ条件を構築
    const query: Record<string, unknown> = { ownerId: userId };
    
    if (isFollowing !== null) {
      query.isFollowing = isFollowing === 'true';
    }
    
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
    
    const users = await LineUser.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching LINE users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
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
    const { lineUserId } = body;

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User ID is required' },
        { status: 400 }
      );
    }

    // Dynamic imports
    const { default: dbConnect } = await import('@/lib/mongodb');
    const { LineUser } = await import('@/models/LineUser');
    const { LineMessagingConfig } = await import('@/models/LineMessagingConfig');
    const { LineMessagingService } = await import('@/lib/line-messaging-service');
    
    await dbConnect();
    
    // LINE Messaging設定を確認
    const config = await LineMessagingConfig.findOne({ 
      ownerId: userId,
      isActive: true 
    });
    
    if (!config) {
      return NextResponse.json(
        { error: 'LINE Messaging not configured' },
        { status: 404 }
      );
    }
    
    // LINE APIからユーザープロファイルを取得
    const lineService = new LineMessagingService(config.channelAccessToken);
    const profile = await lineService.getUserProfile(lineUserId);
    
    // ユーザー情報を保存または更新
    const user = await LineUser.findOneAndUpdate(
      { ownerId: userId, lineUserId },
      {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
        isFollowing: true,
        followedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error adding LINE user:', error);
    return NextResponse.json(
      { error: 'Failed to add user' },
      { status: 500 }
    );
  }
}