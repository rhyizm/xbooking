'use client';

import { useOrganization } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function OrganizationSettings() {
  const { organization, membership, isLoaded } = useOrganization();
  const [name, setName] = useState(organization?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'org:member' | 'org:admin'>('org:member');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [linkRole, setLinkRole] = useState<'org:member' | 'org:admin'>('org:member');
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkTtlHours, setLinkTtlHours] = useState<number | ''>('');
  const router = useRouter();
  const locale = useLocale();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!organization) {
    return <div>組織が見つかりません</div>;
  }

  // Clerk roles are like 'org:admin', not 'admin'
  if (membership?.role !== 'org:admin') {
    return <div>アクセス権限がありません</div>;
  }

  const handleUpdate = async () => {
    if (!organization) return;
    
    setIsUpdating(true);
    try {
      await organization.update({
        name: name,
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to update organization:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">組織設定</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="org-name" className="block text-sm font-medium mb-2">
              組織名
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="組織名を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              組織ID
            </label>
            <p className="text-sm text-gray-600">{organization.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              作成日
            </label>
            <p className="text-sm text-gray-600">
              {new Date(organization.createdAt).toLocaleDateString('ja-JP')}
            </p>
          </div>

          <button
            onClick={handleUpdate}
            disabled={isUpdating || name === organization.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? '更新中...' : '更新'}
          </button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">メンバーの招待</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium mb-2">メールアドレス</label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="invitee@example.com"
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium mb-2">ロール</label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'org:member' | 'org:admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="org:member">メンバー</option>
              <option value="org:admin">管理者</option>
            </select>
          </div>
          <button
            onClick={async () => {
              if (!organization) return;
              setInviteStatus(null);
              setInviteError(null);
              try {
                const res = await fetch(`/api/organizations/${organization.id}/invitations`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: inviteEmail, role: inviteRole, locale }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error || `Failed with ${res.status}`);
                }
                setInviteStatus('招待メールを送信しました。受信者がリンクを開くと、このアプリでサインイン/サインアップして組織に参加します。');
                setInviteEmail('');
                setInviteRole('org:member');
              } catch (e: unknown) {
                const msg = e instanceof Error && e.message
                  ? e.message
                  : '招待の作成に失敗しました';
                setInviteError(msg);
              }
            }}
            disabled={!inviteEmail}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            招待リンクを生成して送信
          </button>
          {inviteStatus && <p className="text-sm text-gray-700">{inviteStatus}</p>}
          {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">招待リンクを作成（メッセージアプリ用）</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="link-role" className="block text-sm font-medium mb-2">ロール</label>
            <select
              id="link-role"
              value={linkRole}
              onChange={(e) => setLinkRole(e.target.value as 'org:member' | 'org:admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="org:member">メンバー</option>
              <option value="org:admin">管理者</option>
            </select>
          </div>
          <div>
            <label htmlFor="link-ttl" className="block text-sm font-medium mb-2">有効期限（時間、空欄可）</label>
            <input
              id="link-ttl"
              type="number"
              min={1}
              value={linkTtlHours === '' ? '' : linkTtlHours}
              onChange={(e) => {
                const v = e.target.value;
                setLinkTtlHours(v === '' ? '' : Math.max(1, parseInt(v, 10)));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 24"
            />
          </div>
          <button
            onClick={async () => {
              if (!organization) return;
              setLinkError(null);
              setLinkUrl(null);
              try {
                const res = await fetch(`/api/organizations/${organization.id}/invite-links`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: linkRole, ttlHours: linkTtlHours === '' ? undefined : linkTtlHours, locale }),
                });
                const j = await res.json();
                if (!res.ok) throw new Error(j?.error || `Failed with ${res.status}`);
                setLinkUrl(j.inviteUrl);
              } catch (e: unknown) {
                const msg = e instanceof Error && e.message
                  ? e.message
                  : 'リンクの作成に失敗しました';
                setLinkError(msg);
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            招待リンクを生成
          </button>
          {linkUrl && (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">招待URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={linkUrl}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(linkUrl);
                    } catch {}
                  }}
                  className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  コピー
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">このリンクをLINEなどで共有できます。受信者はサインイン/サインアップ後、自動的に組織に参加します。</p>
            </div>
          )}
          {linkError && <p className="text-sm text-red-600">{linkError}</p>}
        </div>
      </div>
    </div>
  );
}
