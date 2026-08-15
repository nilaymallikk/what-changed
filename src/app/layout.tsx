import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '../components/Header';

export const metadata: Metadata = {
  metadataBase: new URL('https://whatchanged.io'),
  title: {
    default: 'What Changed Around Me — Hyperlocal Neighborhood Intelligence',
    template: '%s | What Changed Around Me',
  },
  description:
    'Track physical, commercial, and demographic changes across any US neighborhood. Discover new openings, unlisted places, and 10-year Census shifts using 100% open public data.',
  keywords: [
    'neighborhood changes',
    'what changed around me',
    'new businesses opened',
    'hyperlocal intelligence',
    'census demographics',
    'ZIP code lookup',
    'spatial change detection',
    'local economy tracker'
  ],
  authors: [{ name: 'Nilay Mallik', url: 'https://x.com/nilaymallikX' }],
  creator: 'Nilay Mallik',
  publisher: 'What Changed Around Me',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://whatchanged.io',
    siteName: 'What Changed Around Me',
    title: 'What Changed Around Me — Hyperlocal Neighborhood Intelligence',
    description:
      'Track physical, commercial, and demographic changes across any US neighborhood using 100% open public data and spatial intelligence.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Changed Around Me',
    description: 'Track physical, commercial, and demographic changes across any US neighborhood.',
    creator: '@nilaymallikX',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen bg-black text-white font-sans antialiased flex flex-col selection:bg-white selection:text-black">
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
