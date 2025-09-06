// src/components/sso/Line.tsx

'use client'
import { useEffect } from 'react'
import liff from '@line/liff'

type LiffEntryProps = {
  redirectUri: string
  // LIFF内でログイン済み(= liff.isLoggedIn() === true)になった後に実行する処理。
  // 例: Clerk の authenticateWithRedirect を呼ぶ。
  onAfterLiffLogin?: () => Promise<void> | void
  // 上書き可能な LIFF ID。未指定の場合は環境変数を利用。
  liffId?: string
  // 失敗時に外部ブラウザで開くフォールバックURL。
  fallbackUrl?: string
}

export default function LiffEntry({ redirectUri, onAfterLiffLogin, liffId, fallbackUrl }: LiffEntryProps) {
  useEffect(() => {
    (async () => {
      const id = liffId ?? process.env.NEXT_PUBLIC_LIFF_ID!
      await liff.init({ liffId: id })

      // LIFFブラウザ起動時は liff.login() は自動実行扱い
      // 未ログインで外部/インアプリブラウザから開いた場合のみ login
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: redirectUri })
        return
      }

      if (!onAfterLiffLogin) return
      try {
        await onAfterLiffLogin()
      } catch {
        // LIFFブラウザ内でのOAuthが不安定なケースのフォールバック
        const url = fallbackUrl ?? `${location.origin}/liff`
        liff.openWindow({ url, external: true })
      }
    })()
  }, [onAfterLiffLogin, liffId, fallbackUrl])

  return null
}
