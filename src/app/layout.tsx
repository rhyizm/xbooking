import type { Metadata } from 'next';
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { enUS, jaJP, frFR } from '@clerk/localizations';
import { cookies } from 'next/headers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'xScheduler',
  description: 'Scheduling app',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = cookieLocale === 'ja' || cookieLocale === 'fr' || cookieLocale === 'en' ? cookieLocale : 'ja';
  const clerkLocalization = locale === 'ja' ? jaJP : locale === 'fr' ? frFR : enUS;
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider localization={clerkLocalization}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
