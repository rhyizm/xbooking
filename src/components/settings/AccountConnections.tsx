'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useClerk } from "@clerk/nextjs";
import { useState } from "react";

// Define props interface
interface AccountConnectionsProps {
  title: string;
  description: string;
  googleConnectedText: string;
  googleConnectText: string;
  googleDisconnectText: string;
  lineConnectedText: string;
  lineConnectText: string;
  lineDisconnectText: string;
}

export default function AccountConnections({
  title,
  description,
  googleConnectedText,
  googleConnectText,
  googleDisconnectText,
  lineConnectedText,
  lineConnectText,
  lineDisconnectText,
}: AccountConnectionsProps) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [isLoading, setIsLoading] = useState<{ google: boolean; line: boolean }>({
    google: false,
    line: false
  });
  
  // Check if accounts are connected by looking at external accounts
  const isGoogleConnected = user?.externalAccounts?.some(
    account => account.provider === 'google'
  ) || false;
  
  const isLineConnected = user?.externalAccounts?.some(
    account => account.provider === 'line'
  ) || false;

  const handleConnect = async (provider: 'google' | 'line') => {
    setIsLoading(prev => ({ ...prev, [provider]: true }));
    try {
      // Open user profile with the account connections section
      openUserProfile({ 
        appearance: {
          elements: {
            modalContent: "max-w-2xl"
          }
        }
      });
    } catch (error) {
      console.error(`Error connecting ${provider}:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider: 'google' | 'line') => {
    setIsLoading(prev => ({ ...prev, [provider]: true }));
    try {
      const accountToDisconnect = user?.externalAccounts?.find(
        account => account.provider === provider
      );
      
      if (accountToDisconnect) {
        await accountToDisconnect.destroy();
      }
    } catch (error) {
      console.error(`Error disconnecting ${provider}:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Connection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
          </div>
          <div className="flex items-center space-x-2">
            {isGoogleConnected && (
              <span className="text-sm text-muted-foreground">
                {googleConnectedText}
              </span>
            )}
            <Button
              variant={isGoogleConnected ? "destructive" : "default"}
              size="sm"
              onClick={() => isGoogleConnected ? handleDisconnect('google') : handleConnect('google')}
              disabled={isLoading.google}
            >
              {isGoogleConnected ? googleDisconnectText : googleConnectText}
            </Button>
          </div>
        </div>

        {/* LINE Connection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#00C300" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.348 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            <span>LINE</span>
          </div>
          <div className="flex items-center space-x-2">
            {isLineConnected && (
              <span className="text-sm text-muted-foreground">
                {lineConnectedText}
              </span>
            )}
            <Button
              variant={isLineConnected ? "destructive" : "default"}
              size="sm"
              onClick={() => isLineConnected ? handleDisconnect('line') : handleConnect('line')}
              disabled={isLoading.line}
            >
              {isLineConnected ? lineDisconnectText : lineConnectText}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}