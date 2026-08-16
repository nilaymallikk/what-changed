import type { Metadata } from 'next';
import ExploreClient from './ExploreClient';

export const metadata: Metadata = {
  title: 'Explore US Metros, States & Regional Corridors | What Changed Around Me',
  description:
    'Discover commercial and demographic shifts across major American metro areas. Browse top ZIP codes across the Northeast, Pacific Coast, Sunbelt, Deep South, and Midwest with US Census ACS intelligence.',
  alternates: {
    canonical: 'https://whatchangedaround.me/explore',
  },
  keywords: [
    'explore US metros',
    'neighborhood trends by state',
    'top growing neighborhoods in USA',
    'regional economic corridors',
    'US census demographics directory',
    'what changed around me directory'
  ],
  openGraph: {
    title: 'Explore Major US Metros & Regional Corridors | What Changed Around Me',
    description:
      'Discover commercial and demographic shifts across major American metro areas. Browse top ZIP codes with official US Census & spatial intelligence.',
    url: 'https://whatchangedaround.me/explore',
    siteName: 'What Changed Around Me',
    type: 'website',
    images: [
      {
        url: '/architecture.png',
        width: 1200,
        height: 630,
        alt: 'Explore US Metros on What Changed Around Me'
      }
    ],
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

const exploreBreadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://whatchangedaround.me'
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Explore Metros',
      item: 'https://whatchangedaround.me/explore'
    }
  ]
};

const metroDirectorySchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'US Regional Corridors & Metro Hubs',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Northeast Corridor (New York, Boston, Philadelphia)',
      url: 'https://whatchangedaround.me/explore#northeast'
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'West Coast & Pacific (San Francisco, Los Angeles, Seattle)',
      url: 'https://whatchangedaround.me/explore#pacific'
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'South & Sunbelt (Austin, Houston, Miami, Atlanta)',
      url: 'https://whatchangedaround.me/explore#sunbelt'
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'Deep South & Mississippi Delta (Pontotoc, Senatobia, Oxford, Tupelo)',
      url: 'https://whatchangedaround.me/explore#south'
    },
    {
      '@type': 'ListItem',
      position: 5,
      name: 'Midwest & Great Lakes (Chicago, Minneapolis, Detroit)',
      url: 'https://whatchangedaround.me/explore#midwest'
    }
  ]
};

export default function ExplorePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(exploreBreadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metroDirectorySchema) }}
      />
      
      {/* Semantic Server-Rendered HTML for Crawlers */}
      <section className="sr-only">
        <h1>Explore US Metros, Neighborhoods & Regional Corridors</h1>
        <p>
          Directory of American cities, suburban nodes, and regional corridors with live business openings, 8-variable US Census demographics, and spatial vitality scores.
        </p>
      </section>

      <ExploreClient />
    </>
  );
}
