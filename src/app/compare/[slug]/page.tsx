import type { Metadata } from 'next';
import { defaultGeocodingProvider } from '@/services/geocoding';
import { CompareClient } from './CompareClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split('-vs-');
  const zipA = parts[0] || '10001';
  const zipB = parts[1] || '90210';
  const url = `https://whatchangedaround.me/compare/${slug}`;

  try {
    const [geoA, geoB] = await Promise.all([
      defaultGeocodingProvider.resolveZip(zipA),
      defaultGeocodingProvider.resolveZip(zipB)
    ]);

    const title = `${geoA.city}, ${geoA.state} (${geoA.zip}) vs ${geoB.city}, ${geoB.state} (${geoB.zip}) Head-to-Head Comparison | What Changed Around Me`;
    const description = `Compare ${geoA.city}, ${geoA.state} vs ${geoB.city}, ${geoB.state} head-to-head. Benchmark commercial opening velocities, US Census ACS household incomes, housing densities, and neighborhood vitality index.`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      keywords: [
        `${geoA.city} vs ${geoB.city}`,
        `compare ${geoA.zip} vs ${geoB.zip}`,
        `${geoA.city} ${geoA.state} cost of living vs ${geoB.city}`,
        `${geoA.city} vs ${geoB.city} demographics and income`,
        `neighborhood comparison tool`,
        `compare zip codes head to head`
      ],
      openGraph: {
        title,
        description,
        url,
        siteName: 'What Changed Around Me',
        type: 'website',
        images: [
          {
            url: '/architecture.png',
            width: 1200,
            height: 630,
            alt: `${geoA.city} vs ${geoB.city} Comparison`
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        creator: '@nilaymallikX',
        images: ['/architecture.png'],
      }
    };
  } catch {
    return {
      title: `Neighborhood Comparison: ZIP ${zipA} vs ${zipB} | What Changed Around Me`,
      description: `Side-by-side comparison of US ZIP codes on What Changed Around Me.`,
      alternates: {
        canonical: url,
      },
    };
  }
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const parts = slug.split('-vs-');
  const zipA = parts[0] || '10001';
  const zipB = parts[1] || '90210';

  let geoA = { zip: zipA, city: 'Area A', state: 'US', latitude: 40.75, longitude: -73.99 };
  let geoB = { zip: zipB, city: 'Area B', state: 'US', latitude: 34.07, longitude: -118.40 };

  try {
    const [resA, resB] = await Promise.all([
      defaultGeocodingProvider.resolveZip(zipA),
      defaultGeocodingProvider.resolveZip(zipB)
    ]);
    geoA = resA;
    geoB = resB;
  } catch {
    // fallback
  }

  const breadcrumbSchema = {
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
        name: 'Compare Neighborhoods',
        item: 'https://whatchangedaround.me/compare'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${geoA.city} (${geoA.zip}) vs ${geoB.city} (${geoB.zip})`,
        item: `https://whatchangedaround.me/compare/${slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Semantic Server-Rendered HTML for Crawlers */}
      <section className="sr-only">
        <h1>{geoA.city}, {geoA.state} ({geoA.zip}) vs {geoB.city}, {geoB.state} ({geoB.zip}) Comparison</h1>
        <p>
          Side-by-side benchmark comparing {geoA.city} and {geoB.city} across commercial opening velocities, official US Census ACS demographics, median household income, housing units, and neighborhood vitality scores.
        </p>
      </section>

      <CompareClient slug={slug} />
    </>
  );
}
