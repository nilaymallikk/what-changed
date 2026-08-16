import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '../components/Header';

export const metadata: Metadata = {
  metadataBase: new URL('https://whatchangedaround.me'),
  title: {
    default: 'What Changed Around Me — Real-Time Neighborhood Spatial Intelligence',
    template: '%s | What Changed Around Me',
  },
  description:
    'Track physical, commercial, and demographic changes across any US neighborhood. Discover new store openings, business filings, 8-metric US Census shifts, and 5-axis vitality scores.',
  keywords: [
    'what changed around me',
    'neighborhood changes',
    'new businesses opened near me',
    'hyperlocal spatial intelligence',
    'US census demographics by zip',
    'median household income by zip',
    'neighborhood vitality index',
    'compare zip codes side by side',
    'who is moving to my area',
    'commercial permits and store openings'
  ],
  authors: [{ name: 'Nilay Mallik', url: 'https://x.com/nilaymallikX' }],
  creator: 'Nilay Mallik',
  publisher: 'What Changed Around Me',
  alternates: {
    canonical: 'https://whatchangedaround.me',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://whatchangedaround.me',
    siteName: 'What Changed Around Me',
    title: 'What Changed Around Me — Real-Time Neighborhood Spatial Intelligence',
    description:
      'Track physical, commercial, and demographic changes across any US neighborhood using 100% open public data, US Census ACS metrics, and live spatial intelligence.',
    images: [
      {
        url: '/architecture.png',
        width: 1200,
        height: 630,
        alt: 'What Changed Around Me Spatial Intelligence Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Changed Around Me — Real-Time Neighborhood Spatial Intelligence',
    description: 'Track physical, commercial, and demographic changes across any US neighborhood.',
    creator: '@nilaymallikX',
    images: ['/architecture.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'DP2SEiPsDQwD1xG1EiVrwLqjG_t2YG09Zr3FcuNS7Z8',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'What Changed Around Me',
  url: 'https://whatchangedaround.me',
  applicationCategory: 'Geographic, Real Estate, Demographics Application',
  operatingSystem: 'Any',
  description:
    'Real-time neighborhood spatial intelligence platform tracking business openings, corporate filings, official US Census Bureau demographics, and neighborhood vitality indices.',
  author: {
    '@type': 'Person',
    name: 'Nilay Mallik',
    url: 'https://x.com/nilaymallikX',
  },
  creator: {
    '@type': 'Person',
    name: 'Nilay Mallik',
    url: 'https://x.com/nilaymallikX',
  },
  featureList: [
    'Real-Time Spatial Radar & Store Openings',
    '8-Metric Official US Census ACS 5-Year Demographics',
    '5-Axis Neighborhood Vitality Index Polygon Chart',
    'Interactive Before/After Time Machine & Split Diff Lens',
    'Who is Moving In? Migration Inflow Corridor Analytics',
    '60-Second AI Neural Audio Briefings',
    'Ground Truth Community Verification',
    'Head-to-Head ZIP Code Benchmark Comparison',
    'Nationwide 50-State Metro Directory'
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://whatchangedaround.me/area/{search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-black text-white font-sans antialiased flex flex-col selection:bg-white selection:text-black">
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
