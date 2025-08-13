// src/app/(org)/[locale]/organizations/[slug]/members/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  useOrganization,
  useUser,
} from '@clerk/nextjs';
import type { OrganizationCustomRoleKey } from '@clerk/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export const OrgMembersParams = {
  memberships: {
    pageSize: 10,
    keepPreviousData: true,
  },
  invitations: {
    pageSize: 10,
    keepPreviousData: true,
  },
};

export default function OrganizationMembersPage() {
  const { user } = useUser();
  const {
    organization,
    isLoaded,
    memberships,
    invitations,
    membership: currentMembership,
  } = useOrganization(OrgMembersParams);

  /* ▼ state ---------------------------------------- */
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationCustomRoleKey>('org:member');
  const [rolesCache, setRolesCache] = useState<OrganizationCustomRoleKey[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  /* ▼ 役職一覧を 1 回だけ取得 ----------------------- */
  const hasFetchedRoles = useRef(false);
  useEffect(() => {
    if (hasFetchedRoles.current || !organization) return;

    organization
      .getRoles({ pageSize: 50, initialPage: 1 })
      .then((res) => {
        hasFetchedRoles.current = true;
        setRolesCache(res.data.map((r) => r.key as OrganizationCustomRoleKey));
      })
      .catch(console.error);
  }, [organization?.id]);

  /* ▼ 権限制御 -------------------------------------- */
  const canManageMembers = currentMembership?.role === 'org:admin';

  /* ▼ インビテーション送信 -------------------------- */
  const inviteMembers = async () => {
    if (!inviteEmail) {
      toast({ title: 'メールアドレスを入力してください', variant: 'destructive' });
      return;
    }

    try {
      setIsInviting(true);
      await organization?.inviteMembers({
        emailAddresses: [inviteEmail],
        role: inviteRole,
      }); /* Clerk Frontend SDK – inviteMembers :contentReference[oaicite:0]{index=0} */

      toast({ title: '招待メールを送信しました' });
      setInviteEmail('');

      if (!invitations) {
        throw new Error('Inivitation is undefined')
      }

      await invitations?.revalidate?.();
    } catch (err: unknown) {
      toast({
        title: '招待に失敗しました',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  /* ▼ メンバー削除 ---------------------------------- */
  const removeMember = async (membershipId: string) => {
    const m = memberships?.data?.find((m) => m.id === membershipId);
    if (!m) return;
    try {
      await m.destroy(); /* OrganizationMembership.destroy() :contentReference[oaicite:1]{index=1} */
      toast({ title: 'メンバーを削除しました' });
      await memberships?.revalidate?.();
    } catch (err: unknown) {
      toast({
        title: '削除に失敗しました',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  /* ▼ 画面 ------------------------------------------ */
  if (!isLoaded) return <p>Loading…</p>;
  if (!organization) return <p>No organization</p>;

  return (
    <section className="space-y-8">
      {/* --- 招待フォーム ------------------------------------------------ */}
      {canManageMembers && (
        <div className="flex gap-4 items-end">
          <Input
            placeholder="user@example.com"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrganizationCustomRoleKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {rolesCache.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={inviteMembers} disabled={isInviting}>
            {isInviting ? '送信中…' : '招待'}
          </Button>
        </div>
      )}

      {/* --- メンバー一覧 ------------------------------------------------ */}
      <ul className="space-y-3">
        {memberships?.data?.map((m) => (
          <li key={m.id} className="flex justify-between items-center border p-3 rounded">
            <div>
              <p className="font-medium">
                {m.publicUserData?.identifier ?? '(unknown)'}
              </p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </div>
            {canManageMembers && m.publicUserData?.userId !== user?.id && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeMember(m.id)}
              >
                削除
              </Button>
            )}
          </li>
        ))}
      </ul>

      {/* --- ページネーション ------------------------------------------- */}
      {(memberships?.hasPreviousPage || memberships?.hasNextPage) && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            disabled={!memberships?.hasPreviousPage || memberships?.isFetching}
            onClick={() => memberships?.fetchPrevious?.()}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            disabled={!memberships?.hasNextPage || memberships?.isFetching}
            onClick={() => memberships?.fetchNext?.()}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
