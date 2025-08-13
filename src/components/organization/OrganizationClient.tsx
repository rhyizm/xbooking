"use client";

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { 
  OrganizationList,
  useOrganizationList
} from '@clerk/nextjs';
import { dark } from "@clerk/themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus } from 'lucide-react';

export default function OrganizationClient() {
  const t = useTranslations('organization');
  const { } = useOrganizationList();

  const { theme } = useTheme();

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('yourOrganizations')}</CardTitle>
            <CardDescription>{t('manageYourOrganizations')}</CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationList
              hidePersonal
              hideSlug
              afterSelectOrganizationUrl={(org) => `/organizations/${org.slug}/settings`}
              afterCreateOrganizationUrl={(org) => `/organizations/${org.slug}/settings`}
              appearance={{
                baseTheme: theme === 'dark' ? dark : undefined,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}