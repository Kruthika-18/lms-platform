import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '../components/layout/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title:       { default: 'LearnHub', template: '%s | LearnHub' },
  description: 'Master in-demand tech skills with expert-led courses in AI, Data Science, and Software Engineering.',
  keywords:    ['online learning', 'data science', 'AI', 'programming courses'],
  openGraph: {
    type:     'website',
    locale:   'en_US',
    siteName: 'LearnHub',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-white dark:bg-brand-900 text-gray-900 dark:text-gray-100 antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}