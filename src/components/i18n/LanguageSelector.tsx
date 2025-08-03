'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const locales = ['en', 'ja', 'fr'] as const;
type Locale = typeof locales[number];

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: Locale) => {
    startTransition(() => {
      const segments = pathname.split('/');
      const firstSegmentIsLocale = locales.includes(segments[1] as Locale);

      if (firstSegmentIsLocale) {
        segments[1] = newLocale;
      } else {
        if (pathname === '/') {
          segments.splice(1, 0, newLocale);
        } else {
           segments.splice(1, 0, newLocale);
        }
      }
      const newPath = segments.join('/');
      router.push(newPath);
    });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getLanguageName = (locale: string) => {
    switch (locale) {
      case 'en':
        return 'English';
      case 'ja':
        return '日本語';
      case 'fr':
        return 'Français';
      default:
        return locale;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border-2 border-bg-foreground hover:bg-foreground/10 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-gray-600 dark:text-gray-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
          />
        </svg>
        <span className={`text-sm font-medium text-gray-700 dark:text-gray-200 ${isPending ? 'opacity-50' : ''}`}>
          {getLanguageName(currentLocale)}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {locales.map((locale) => ( // Use the defined locales array
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                disabled={isPending} // Disable while transitioning
                className={`block w-full text-left px-4 py-2 text-sm ${
                  currentLocale === locale
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold' // Highlight current
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${isPending ? 'cursor-not-allowed opacity-70' : ''}`}
                role="menuitem"
              >
                {getLanguageName(locale)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
