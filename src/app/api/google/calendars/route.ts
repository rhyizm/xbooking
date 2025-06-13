import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the current user's authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's OAuth access token for Google
    const provider = 'oauth_google';
    
    // Get user's OAuth access tokens
    const client = await clerkClient();
    const response = await client.users.getUserOauthAccessToken(
      userId,
      provider
    );

    if (!response || !response.data || response.data.length === 0) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    const accessToken = response.data[0].token;

    // Fetch calendars from Google Calendar API
    const calendarsResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarsResponse.ok) {
      // Handle token expiration or other errors
      if (calendarsResponse.status === 401) {
        return NextResponse.json(
          { error: "Google token expired. Please reconnect your account." },
          { status: 401 }
        );
      }
      
      const errorData = await calendarsResponse.json().catch(() => ({}));
      console.error('Google Calendar API error:', errorData);
      
      return NextResponse.json(
        { error: "Failed to fetch calendars from Google" },
        { status: calendarsResponse.status }
      );
    }

    const calendarsData = await calendarsResponse.json();
    
    // Extract relevant calendar information
    const calendars = calendarsData.items?.map((calendar: { id: string; summary: string; description?: string; primary?: boolean; backgroundColor?: string; foregroundColor?: string; accessRole?: string }) => ({
      id: calendar.id,
      summary: calendar.summary,
      description: calendar.description,
      primary: calendar.primary || false,
      backgroundColor: calendar.backgroundColor,
      foregroundColor: calendar.foregroundColor,
      accessRole: calendar.accessRole,
    })) || [];

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error('Error fetching Google calendars:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}