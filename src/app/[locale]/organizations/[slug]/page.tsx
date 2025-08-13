// app/organizations/[slug]/page.tsx - メインの組織ページ
"use client";

import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, UserPlus, Users, BarChart3 } from 'lucide-react';

export default function OrganizationPage({ params }: { params: { slug: string } }) {
  const { organization, isLoaded } = useOrganization();
  const router = useRouter();

  if (!isLoaded) {
    return <div>読み込み中...</div>;
  }

  if (!organization) {
    return <div>組織が見つかりません</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
        <p className="text-muted-foreground">組織の管理ダッシュボード</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              組織設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              組織の基本情報や設定を管理
            </p>
            <Button 
              onClick={() => router.push(`/organizations/${params.slug}/settings`)}
              className="w-full"
            >
              設定を開く
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              メンバー招待
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              新しいメンバーを組織に招待
            </p>
            <Button 
              onClick={() => router.push(`/organizations/${params.slug}/members`)}
              className="w-full"
            >
              メンバー管理
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              メンバー一覧
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              現在のメンバーを確認・管理
            </p>
            <Button 
              onClick={() => router.push(`/organizations/${params.slug}/members`)}
              variant="outline"
              className="w-full"
            >
              メンバーを見る
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
