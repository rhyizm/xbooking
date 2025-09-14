'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/nextjs';

export default function OrganizationInvitePage() {
  const params = useParams<{ slug: string; locale: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  const token = useMemo(() => search.get('token') || '', [search]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accept = async () => {
      if (!isLoaded || !userId) return;
      if (!token) {
        setError('無効な招待リンクです（token がありません）。');
        return;
      }
      try {
        setMessage('招待を確認しています…');
        const res = await fetch(`/api/organizations/${params.slug}/invites/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `Failed: ${res.status}`);
        setMessage('組織への参加が完了しました。リダイレクトします…');
        router.replace(`/${params.locale}/organizations/${params.slug}/settings`);
      } catch (e: unknown) {
        const msg = e instanceof Error && e.message
          ? e.message
          : '招待の処理に失敗しました';
        setError(msg);
      }
    };
    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId, token, params?.slug]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="mx-auto max-w-md py-16 px-6 text-center">
      <h1 className="text-2xl font-semibold mb-4">組織への参加</h1>

      <SignedOut>
        <p className="mb-4">この組織に参加するにはサインインしてください。</p>
        <div className="flex justify-center">
          <SignIn redirectUrl={currentUrl} />
        </div>
      </SignedOut>

      <SignedIn>
        {message && <p className="text-gray-700 mb-2">{message}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </SignedIn>
    </div>
  );
}
