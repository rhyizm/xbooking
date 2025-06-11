import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const t = await getTranslations();
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('dashboard.title', { defaultValue: 'Dashboard' })}</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.welcome', { defaultValue: 'Welcome!' })}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('dashboard.protectedMessage', { defaultValue: 'This is a protected page. You can only see this if you are signed in.' })}
          </p>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">{t('dashboard.userInfo', { defaultValue: 'Your Information:' })}</h3>
            <dl className="space-y-2">
              <div>
                <dt className="inline font-medium text-gray-600 dark:text-gray-400">User ID:</dt>
                <dd className="inline ml-2">{userId}</dd>
              </div>
              {user?.firstName && (
                <div>
                  <dt className="inline font-medium text-gray-600 dark:text-gray-400">First Name:</dt>
                  <dd className="inline ml-2">{user.firstName}</dd>
                </div>
              )}
              {user?.lastName && (
                <div>
                  <dt className="inline font-medium text-gray-600 dark:text-gray-400">Last Name:</dt>
                  <dd className="inline ml-2">{user.lastName}</dd>
                </div>
              )}
              {user?.emailAddresses?.[0]?.emailAddress && (
                <div>
                  <dt className="inline font-medium text-gray-600 dark:text-gray-400">Email:</dt>
                  <dd className="inline ml-2">{user.emailAddresses[0].emailAddress}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              {t('dashboard.feature1.title', { defaultValue: 'Protected Feature 1' })}
            </h3>
            <p className="text-blue-700 dark:text-blue-300">
              {t('dashboard.feature1.description', { defaultValue: 'This feature is only available to authenticated users.' })}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-green-900 dark:text-green-100">
              {t('dashboard.feature2.title', { defaultValue: 'Protected Feature 2' })}
            </h3>
            <p className="text-green-700 dark:text-green-300">
              {t('dashboard.feature2.description', { defaultValue: 'Another feature that requires authentication to access.' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}