// src/app/[locale]/liff/page.tsx

'use client'
import { useSignIn } from '@clerk/nextjs'
import LiffEntry from "@/components/sso/Line";

export default function LiffPage() {
  const { signIn } = useSignIn()

  return (
    <LiffEntry
      redirectUri={`${location.origin}/liff`}
      onAfterLiffLogin={async () => {
        if (!signIn) return
        await signIn.authenticateWithRedirect({
          strategy: 'oauth_line',
          redirectUrl: `${location.origin}/sso-callback`,
          redirectUrlComplete: `${location.origin}/settings`,
        })
      }}
      // 必要に応じて上書き:
      // liffId={process.env.NEXT_PUBLIC_LIFF_ID}
      fallbackUrl={'/liff'}
    />
  )
}
