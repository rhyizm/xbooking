// app/organizations/[slug]/settings/page.tsx

import { redirect } from 'next/navigation';
import { OrganizationProfile } from '@clerk/nextjs'
import { auth, clerkClient } from '@clerk/nextjs/server';
import OrganizationSettings from "@/components/organization/OrganizationSettings";

export default async function OrganizationSettingsPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  // 現在のユーザー情報を取得
  const { userId } = await auth();
  const { slug } = await params;
  
  if (!userId) {
    // 未認証の場合はリダイレクト
    redirect('/sign-in');
  }

  // 組織情報とメンバーシップを取得
  const clerk = await clerkClient();

  const organizationMemberships = await clerk.users.getOrganizationMembershipList({
    userId
  });

  // 現在の組織でのメンバーシップを探す
  const currentMembership = organizationMemberships.data.find(
    membership => membership.organization.slug === slug
  );

  console.log(currentMembership)
  console.log(currentMembership?.role)

  // ロールチェック
  if (!currentMembership || currentMembership.role !== 'org:admin') {
    // 管理者でない場合はアクセス拒否
    return <div>アクセス権限がありません</div>;
  }

  // 組織情報を取得
  const organization = await clerk.organizations.getOrganization({
    slug: slug
  });

  return (
    <div className="max-w-xl mx-auto py-10">
      <OrganizationSettings />
    </div>
  );
}
