'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LineMessagingIntegrationProps {
  title: string;
  description: string;
  channelIdLabel: string;
  channelSecretLabel: string;
  channelAccessTokenLabel: string;
  webhookUrlLabel: string;
  saveText: string;
  deleteText: string;
  savingText: string;
  deletingText: string;
  savedText: string;
  deletedText: string;
  errorText: string;
}

export default function LineMessagingIntegration({
  title,
  description,
}: LineMessagingIntegrationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          LINE Messaging連携の設定はまだ利用できません。準備が整い次第、こちらでご案内します。
        </p>
      </CardContent>
    </Card>
  );
}
