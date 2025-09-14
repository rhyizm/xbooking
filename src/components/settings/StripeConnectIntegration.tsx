'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';

interface StripeAccountStatus {
  accountExists: boolean;
  accountId?: string;
  accountType?: 'express' | 'standard';
  onboardingCompleted?: boolean;
  accountEnabled?: boolean;
}

export default function StripeConnectIntegration() {
  const { user } = useUser();
  const [status, setStatus] = useState<StripeAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountType] = useState<'express' | 'standard'>('express');
  
  const isMerchant = user?.unsafeMetadata?.role === 'merchant';

  useEffect(() => {
    fetchAccountStatus();
  }, []);

  const fetchAccountStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/stripe/connect/account');
      const data = await response.json();
      
      if (!response.ok && response.status !== 404) {
        // 404は正常（アカウントがまだ存在しない）
        setError(data.error || 'Failed to fetch account status');
      } else {
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch account status:', error);
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const createStripeAccount = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/connect/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: accountType }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await fetchAccountStatus();
      } else {
        setError(data.error || 'Failed to create Stripe account');
      }
    } catch (error) {
      console.error('Failed to create Stripe account:', error);
      setError('Failed to create Stripe account');
    } finally {
      setCreating(false);
    }
  };

  const startOnboarding = async () => {
    setError(null);
    try {
      const response = await fetch('/api/stripe/connect/onboarding', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start onboarding');
      }
    } catch (error) {
      console.error('Failed to start onboarding:', error);
      setError('Failed to start onboarding');
    }
  };

  const openDashboard = async () => {
    setError(null);
    try {
      const response = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        window.open(data.url, '_blank');
      } else {
        setError(data.error || 'Failed to open dashboard');
      }
    } catch (error) {
      console.error('Failed to open dashboard:', error);
      setError('Failed to open dashboard');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect設定</CardTitle>
          <CardDescription>売上受け取り設定を管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <p>読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Connect設定</CardTitle>
        <CardDescription>
          加盟店として売上を受け取るためのStripe設定を管理します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMerchant ? (
          <Alert>
            <AlertDescription>
              Stripe Connectアカウントは、merchant（加盟店）ユーザーのみが作成できます。
            </AlertDescription>
          </Alert>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !status?.accountExists ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              まだStripeアカウントが作成されていません。
            </p>
            <Button 
              onClick={createStripeAccount} 
              disabled={creating}
            >
              {creating ? 'アカウント作成中...' : 'Stripeアカウントを作成'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">アカウントID:</span>
                <p className="text-muted-foreground font-mono">{status.accountId}</p>
              </div>
              <div>
                <span className="font-medium">オンボーディング:</span>
                <p className={status.onboardingCompleted ? 'text-green-600' : 'text-yellow-600'}>
                  {status.onboardingCompleted ? '完了' : '未完了'}
                </p>
              </div>
              <div>
                <span className="font-medium">決済受付:</span>
                <p className={status.accountEnabled ? 'text-green-600' : 'text-red-600'}>
                  {status.accountEnabled ? '有効' : '無効'}
                </p>
              </div>
            </div>

            {!status.onboardingCompleted && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  オンボーディングを完了して決済を有効にしてください。
                </p>
                <Button onClick={startOnboarding}>
                  オンボーディングを開始
                </Button>
              </div>
            )}

            {status.onboardingCompleted && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">
                  ✅ Stripe設定が完了しています。決済を受け付けることができます。
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchAccountStatus()}
                  >
                    状態を更新
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={startOnboarding}
                  >
                    Stripe設定を管理
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={openDashboard}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Stripeダッシュボード
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
