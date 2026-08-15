import type { Metadata } from 'next';
import ExploreClient from './ExploreClient';

export const metadata: Metadata = {
  title: 'Explore Major US Metros & Regional Corridors',
  description:
    'Discover commercial and demographic shifts across major American metro areas. Browse top ZIP codes in the Northeast, West Coast, Sunbelt, Midwest, and Pacific Northwest.',
  alternates: {
    canonical: 'https://whatchangedaround.me/explore',
  },
  openGraph: {
    title: 'Explore Major US Metros & Regional Corridors | What Changed Around Me',
    description:
      'Discover commercial and demographic shifts across major American metro areas. Browse top ZIP codes with official US Census & spatial intelligence.',
    url: 'https://whatchangedaround.me/explore',
    siteName: 'What Changed Around Me',
    type: 'website',
    images: ['/architecture.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Major US Metros & Regional Corridors',
    description:
      'Discover commercial and demographic shifts across major American metro areas.',
    creator: '@nilaymallikX',
    images: ['/architecture.png'],
  },
};

export default function ExplorePage() {
  return <ExploreClient />;
}
