// src/app/[locale]/organization/page.tsx

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import OrganizationClient from '@/components/organization/OrganizationClient';

export default async function OrganizationPage() {
  const user = await currentUser();
  
  // Check if user is a merchant
  const isMerchant = user?.unsafeMetadata?.role === 'merchant';
  
  if (!isMerchant) {
    redirect('/');
  }
  
  return <OrganizationClient />;
}