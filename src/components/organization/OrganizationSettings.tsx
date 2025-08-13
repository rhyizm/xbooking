// src/components/organizations/OrganizationSettings.tsx
'use client';

import { OrganizationProfile } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

export default function OrganizationSettings() {
  const { locale } = useParams() as { locale: string };

  return (
    <OrganizationProfile
      routing="path"
      path={`/${locale}/organizations/:slug/settings`}
    />
  );
}
