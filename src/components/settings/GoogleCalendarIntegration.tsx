'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useClerk } from "@clerk/nextjs";

interface GoogleCalendarIntegrationProps {
  title: string;
  description: string;
  connectText: string;
  disconnectText: string;
  connectedText: string;
  fetchingCalendarsText: string;
  calendarsListText: string;
  errorText: string;
}

interface CalendarInfo {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

export default function GoogleCalendarIntegration({
  title,
  description,
  connectText,
  disconnectText,
  connectedText,
  fetchingCalendarsText,
  calendarsListText,
  errorText,
}: GoogleCalendarIntegrationProps) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingCalendars, setIsFetchingCalendars] = useState(false);

  // Check if Google account is connected
  const googleAccount = user?.externalAccounts?.find(
    account => account.provider === 'google'
  );
  const isGoogleConnected = !!googleAccount;

  const fetchCalendars = useCallback(async () => {
    setIsFetchingCalendars(true);
    setError(null);
    
    try {
      const response = await fetch('/api/google/calendars');
      if (!response.ok) {
        throw new Error('Failed to fetch calendars');
      }
      const data = await response.json();
      setCalendars(data.calendars || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsFetchingCalendars(false);
    }
  }, []);

  // Fetch calendars when Google is connected
  useEffect(() => {
    if (isGoogleConnected && calendars.length === 0) {
      fetchCalendars();
    }
  }, [isGoogleConnected, calendars.length, fetchCalendars]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Open Clerk user profile to add Google connection with calendar scope
      openUserProfile({
        appearance: {
          elements: {
            modalContent: "max-w-2xl"
          }
        }
      });
    } catch (error) {
      console.error('Error connecting Google:', error);
      setError('Failed to connect Google account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      if (googleAccount) {
        await googleAccount.destroy();
        setCalendars([]);
        setError(null);
      }
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      setError('Failed to disconnect Google account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status and Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google Calendar</span>
            </div>
            <div className="flex items-center space-x-2">
              {isGoogleConnected && (
                <span className="text-sm text-muted-foreground">
                  {connectedText}
                </span>
              )}
              <Button
                variant={isGoogleConnected ? "destructive" : "default"}
                size="sm"
                onClick={isGoogleConnected ? handleDisconnect : handleConnect}
                disabled={isLoading}
              >
                {isGoogleConnected ? disconnectText : connectText}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorText}: {error}
              </p>
            </div>
          )}

          {/* Calendar List */}
          {isGoogleConnected && !error && (
            <div>
              {isFetchingCalendars ? (
                <p className="text-sm text-muted-foreground">{fetchingCalendarsText}</p>
              ) : calendars.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium mb-2">{calendarsListText}</h4>
                  <div className="space-y-2">
                    {calendars.map((calendar) => (
                      <div
                        key={calendar.id}
                        className="flex items-center space-x-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {calendar.summary}
                            {calendar.primary && (
                              <span className="ml-2 text-xs text-muted-foreground">(Primary)</span>
                            )}
                          </p>
                          {calendar.description && (
                            <p className="text-xs text-muted-foreground">{calendar.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}