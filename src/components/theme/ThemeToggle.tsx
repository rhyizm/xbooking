'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('common');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center p-2 rounded-md bg-foreground/10 hover:bg-foreground/20 transition-colors"
        aria-label={t('toggle_theme')}
      >
        <div className="w-5 h-5" />
        <span className="ml-2">{t('toggle_theme')}</span>
      </button>
    );
  }
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-md bg-foreground/10 dark:bg-foreground/10 hover:bg-foreground/20 transition-colors"
      aria-label={t('toggle_theme')}
    >
      {resolvedTheme === 'light' ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      )}
      <span className="ml-2">{t('toggle_theme')}</span>
    </button>
  );
}
