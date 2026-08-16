import type { Metadata } from 'next';
import { defaultGeocodingProvider } from '@/services/geocoding';
import { ChangeDetailClient } from './ChangeDetailClient';

interface PageProps {
  params: Promise<{ zip: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { zip, id } = await params;
  try {
    const geo = await defaultGeocodingProvider.resolveZip(zip);
    const title = `Place Change Event (${id}) - ${geo.city}, ${geo.state} ${geo.zip} | What Changed Around Me`;
    const description = `Inspect verified commercial openings, corporate business filings, and historical modifications for record ${id} in ${geo.city}, ${geo.state} (${geo.zip}).`;
    const url = `https://whatchangedaround.me/area/${geo.zip}/change/${id}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      keywords: [
        `${geo.city} business opening`,
        `${geo.city} commercial permit`,
        `${geo.zip} place change event`,
        `${geo.city} spatial intelligence`,
        `what changed around me record`
      ],
      openGraph: {
        title,
        description,
        url,
        siteName: 'What Changed Around Me',
        type: 'article',
        images: [
          {
            url: '/architecture.png',
            width: 1200,
            height: 630,
            alt: `Change Record ${id} in ${geo.city}, ${geo.state}`
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
    const url = `https://whatchangedaround.me/area/${zip}/change/${id}`;
    return {
      title: `Change Event Details (${id}) | What Changed Around Me`,
      description: `Detailed change event inspection on What Changed Around Me.`,
      alternates: {
        canonical: url,
      },
    };
  }
}

export default async function ChangePage({ params }: PageProps) {
  const { zip, id } = await params;
  let geo = { zip, city: 'Neighborhood', state: 'USA', latitude: 37.09, longitude: -95.71 };
  try {
    geo = await defaultGeocodingProvider.resolveZip(zip);
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
        name: `${geo.city} (${geo.zip})`,
        item: `https://whatchangedaround.me/area/${geo.zip}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Change Record ${id}`,
        item: `https://whatchangedaround.me/area/${geo.zip}/change/${id}`
      }
    ]
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Spatial Change Event in ${geo.city}, ${geo.state} (${geo.zip})`,
    description: `Detailed verification and historical diff record for place change ${id} in ${geo.city}, ${geo.state}.`,
    author: {
      '@type': 'Organization',
      name: 'What Changed Around Me',
      url: 'https://whatchangedaround.me'
    },
    publisher: {
      '@type': 'Organization',
      name: 'What Changed Around Me',
      url: 'https://whatchangedaround.me'
    },
    mainEntityOfPage: `https://whatchangedaround.me/area/${geo.zip}/change/${id}`
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Semantic Server-Rendered HTML for Crawlers */}
      <section className="sr-only">
        <h1>Place Change Event Details ({id}) in {geo.city}, {geo.state} ({geo.zip})</h1>
        <p>
          Verified physical modifications, commercial business license filings, and historical diff metadata for event ID {id} in {geo.city}, {geo.state} {geo.zip}.
        </p>
      </section>

      <ChangeDetailClient zip={zip} id={id} />
    </>
  );
}
