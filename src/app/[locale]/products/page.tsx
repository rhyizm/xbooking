import StripeProductsManager from '@/components/settings/StripeProductsManager';
import StripeConnectIntegration from '@/components/settings/StripeConnectIntegration';
import { getTranslations } from 'next-intl/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProductsPage() {
  const t = await getTranslations('products');
  const { userId } = await auth();
  if (!userId) redirect('/signin');
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <StripeConnectIntegration />
      <StripeProductsManager />
    </div>
  );
}
