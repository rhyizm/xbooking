'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

// Callback page to complete LINE OAuth via Clerk for /line fallback

export default function LineOAuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center text-gray-600">
        <AuthenticateWithRedirectCallback
          signInUrl="/signin"
          signInFallbackRedirectUrl="/settings"
          signUpFallbackRedirectUrl="/settings"
        />
          Please wait, logging you in...
      </div>
    </div>
  )
}
