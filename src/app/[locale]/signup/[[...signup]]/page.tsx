// src/app/[locale]/signup/[[...signup]]/page.tsx

'use client';

import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';

export default function SignUpPage() {
  const { theme } = useTheme();
  const locale = useLocale();
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp 
        afterSignUpUrl={`/${locale}/settings`}
        unsafeMetadata={{
          role: 'merchant'
        }}
        appearance={{
          baseTheme: theme === 'dark' ? dark : undefined,
          elements: {
            formButtonPrimary: 'text-white bg-blue-600 hover:bg-blue-700',
            socialButtonsBlockButton: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600',
            footerActionLink: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
          },
        }}
      />
    </div>
  );
}
