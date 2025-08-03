'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import LanguageSelector from "@/components/i18n/LanguageSelector";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function AppearanceSettings() {
  const t = useTranslations('settings.appearance');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t('themeLabel')}</Label>
          <p className="text-sm text-muted-foreground">{t('themeDescription')}</p>
          <div className="pt-2">
            <ThemeToggle />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>{t('languageLabel')}</Label>
          <p className="text-sm text-muted-foreground">{t('languageDescription')}</p>
          <div className="pt-2">
            <LanguageSelector />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}