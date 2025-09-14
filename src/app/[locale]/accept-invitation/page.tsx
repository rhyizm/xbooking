'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { setActive } = useClerk();
  const router = useRouter();

  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const ticket = useMemo(() => searchParams.get('__clerk_ticket') ?? '', [searchParams]);
  const status = useMemo(() => searchParams.get('__clerk_status') ?? '', [searchParams]);

  useEffect(() => {
    const run = async () => {
      if (!ticket) {
        setError('無効な招待リンクです（ticket がありません）。');
        return;
      }
      if (!isSignInLoaded || !isSignUpLoaded) return;

      try {
        setMessage('招待を処理しています…');
        if (status === 'sign_in') {
          const res = await signIn!.create({ strategy: 'ticket', ticket });
          if (res.status === 'complete') {
            await setActive!({ session: res.createdSessionId });
            setMessage('サインインが完了しました。リダイレクトします…');
            router.replace('/');
          } else {
            setMessage('追加の認証が必要です。画面の指示に従ってください。');
          }
        } else if (status === 'sign_up') {
          const res = await signUp!.create({ strategy: 'ticket', ticket });
          if (res.status === 'complete') {
            await setActive!({ session: res.createdSessionId });
            setMessage('サインアップが完了しました。リダイレクトします…');
            router.replace('/');
          } else {
            setMessage('追加の認証が必要です。画面の指示に従ってください。');
          }
        } else if (status === 'complete') {
          // 既に処理済み
          setMessage('招待はすでに処理済みです。リダイレクトします…');
          router.replace('/');
        } else {
          // ステータスが来ない場合も ticket 戦略で signIn を試行
          const res = await signIn!.create({ strategy: 'ticket', ticket });
          if (res.status === 'complete') {
            await setActive!({ session: res.createdSessionId });
            setMessage('認証が完了しました。リダイレクトします…');
            router.replace('/');
          } else {
            setMessage('追加の認証が必要です。画面の指示に従ってください。');
          }
        }
      } catch (err: unknown) {
        console.error(err);
        let message = '招待の処理に失敗しました。リンクが無効または期限切れの可能性があります。';
        if (err instanceof Error && err.message) {
          message = err.message;
        } else if (typeof err === 'object' && err !== null) {
          const e = err as { errors?: Array<{ message?: string }>; message?: string };
          if (e.errors?.[0]?.message) message = e.errors[0].message as string;
          else if (typeof e.message === 'string') message = e.message;
        }
        setError(message);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket, status, isSignInLoaded, isSignUpLoaded]);

  return (
    <div className="mx-auto max-w-md py-16 px-6 text-center">
      <h1 className="text-2xl font-semibold mb-4">組織への参加</h1>
      {message && <p className="text-gray-700 mb-2">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
