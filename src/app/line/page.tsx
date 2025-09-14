// src/app/line/page.tsx
'use client'

import { useCallback, useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// LINE-only sign-in page using Clerk SSO (OAuth)
// Route: /line

export default function LinePage() {
  const { signIn, isLoaded } = useSignIn()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLineOAuth = useCallback(async () => {
    if (!isLoaded || !signIn) return
    setLoading(true)
    setError(null)
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_line',
        redirectUrl: '/line/callback',
        // Keep a query marker for post-completion analytics if needed
        redirectUrlComplete: '/settings?src=line_page',
      })
    } catch (e) {
      console.error(e)
      setError('LINEでのログインを開始できませんでした。もう一度お試しください。')
      setLoading(false)
    }
  }, [isLoaded, signIn])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10 sm:py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">LINEでログイン</CardTitle>
          <CardDescription>
            LINEアカウントを使って安全にサインインします。LINEのみ利用可能です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            onClick={handleLineOAuth}
            disabled={!isLoaded || loading}
            aria-busy={loading}
            className="w-full bg-[#06C755] hover:bg-[#05b54d] text-white shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M19.365 4.5H4.635A2.135 2.135 0 0 0 2.5 6.635v7.73c0 1.18.955 2.135 2.135 2.135h5.074l2.927 2.35c.67.537 1.664.064 1.664-.79v-1.56h5.065a2.135 2.135 0 0 0 2.135-2.135v-7.73A2.135 2.135 0 0 0 19.365 4.5z"/>
            </svg>
            {loading ? 'リダイレクト中…' : 'LINEで続行'}
          </Button>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            サインインで問題がある場合はページを更新してお試しください。
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
