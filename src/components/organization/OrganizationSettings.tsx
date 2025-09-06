'use client';

import { useOrganization } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function OrganizationSettings() {
  const { locale } = useParams() as { locale: string };
  const { organization, membership, isLoaded } = useOrganization();
  const [name, setName] = useState(organization?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!organization) {
    return <div>組織が見つかりません</div>;
  }

  if (membership?.role !== 'admin') {
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
    </div>
  );
}
