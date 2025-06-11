'use client';

import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

export default function SignInPage() {
  const { theme } = useTheme();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <SignIn 
        appearance={{
          baseTheme: theme === 'dark' ? dark : undefined,
          elements: {
            formButtonPrimary: 'text-white bg-blue-600 hover:bg-blue-700 text-sm normal-case',
            card: 'bg-white dark:bg-gray-800',
            headerTitle: 'text-gray-900 dark:text-gray-100',
            headerSubtitle: 'text-gray-600 dark:text-gray-400',
            socialButtonsBlockButton: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600',
            formFieldLabel: 'text-gray-700 dark:text-gray-300',
            formFieldInput: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100',
            footerActionLink: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
          },
        }}
      />
    </div>
  );
}