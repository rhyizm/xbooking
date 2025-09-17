'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LineUserManagerProps {
  title: string;
  description: string;
  addUserText: string;
  userIdLabel: string;
  loadingText: string;
  followersText: string;
  noUsersText: string;
  sendTestMessageText: string;
}

export default function LineUserManager({
  title,
  description,
}: LineUserManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          LINEユーザー管理機能は現在準備中です。利用可能になりましたらここに表示されます。
        </p>
      </CardContent>
    </Card>
  );
}
