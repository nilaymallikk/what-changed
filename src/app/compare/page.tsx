import type { Metadata } from 'next';
import CompareHubClient from './CompareHubClient';

export const metadata: Metadata = {
  title: 'Compare Neighborhoods & ZIP Codes Head-to-Head',
  description:
    'Compare any two American neighborhoods or ZIP codes side-by-side. Benchmark commercial opening velocities, 10-year US Census demographic shifts, and Vitality Scores.',
  alternates: {
    canonical: 'https://whatchangedaround.me/compare',
  },
  openGraph: {
    title: 'Compare Neighborhoods & ZIP Codes Head-to-Head | What Changed Around Me',
    description:
      'Compare any two American neighborhoods or ZIP codes side-by-side. Benchmark commercial opening velocities, 10-year US Census demographic shifts, and Vitality Scores.',
    url: 'https://whatchangedaround.me/compare',
    siteName: 'What Changed Around Me',
    type: 'website',
    images: ['/architecture.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Neighborhoods & ZIP Codes Head-to-Head',
    description:
      'Compare any two American neighborhoods side-by-side with official US Census & spatial intelligence.',
    creator: '@nilaymallikX',
    images: ['/architecture.png'],
  },
};

export default function ComparePage() {
  return <CompareHubClient />;
}
