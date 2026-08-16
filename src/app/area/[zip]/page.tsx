import type { Metadata } from 'next';
import { defaultGeocodingProvider } from '@/services/geocoding';
import { AreaDashboardClient } from './AreaDashboardClient';

interface PageProps {
  params: Promise<{ zip: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { zip } = await params;
  try {
    const geo = await defaultGeocodingProvider.resolveZip(zip);
    const title = `What Changed in ${geo.city}, ${geo.state} (${geo.zip}) | What Changed Around Me`;
    const description = `Find out what changed around ${geo.city}, ${geo.state} (${geo.zip}). Real-time store openings, corporate business filings, local modifications, official US Census ACS demographics, and neighborhood vitality index.`;
    const url = `https://whatchangedaround.me/area/${geo.zip}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      keywords: [
        `what changed around me`,
        `what changed in ${geo.city} ${geo.state}`,
        `what changed in ${geo.city}`,
        `${geo.city} new businesses`,
        `${geo.city} business openings`,
        `${geo.zip} census demographics`,
        `${geo.city} ${geo.state} median income`,
        `${geo.zip} vitality score`,
        `${geo.city} real estate and commercial growth`
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
            alt: `What Changed in ${geo.city}, ${geo.state} (${geo.zip})`
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
    const url = `https://whatchangedaround.me/area/${zip}`;
    return {
      title: `What Changed Around ZIP ${zip} | Neighborhood Intelligence`,
      description: `Track real-time commercial openings, business filings, and demographic shifts for US ZIP code ${zip}.`,
      alternates: {
        canonical: url,
      },
    };
  }
}

export default async function AreaPage({ params }: PageProps) {
  const { zip } = await params;
  let geo = { zip, city: 'Neighborhood', state: 'USA', latitude: 37.0902, longitude: -95.7129 };

  try {
    geo = await defaultGeocodingProvider.resolveZip(zip);
  } catch {
    // Default fallback
  }

  // Schema.org Structured Data (JSON-LD)
  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${geo.city}, ${geo.state} ${geo.zip}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: geo.city,
      addressRegion: geo.state,
      postalCode: geo.zip,
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude
    },
    url: `https://whatchangedaround.me/area/${geo.zip}`
  };

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
        name: 'Explore Metros',
        item: 'https://whatchangedaround.me/explore'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${geo.state} Areas`,
        item: `https://whatchangedaround.me/explore#${geo.state.toLowerCase()}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `${geo.city} (${geo.zip})`,
        item: `https://whatchangedaround.me/area/${geo.zip}`
      }
    ]
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What changed in ${geo.city}, ${geo.state} (${geo.zip}) recently?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Spatial intelligence tracks recent store openings, commercial licensing filings, civic landmark upgrades, and unlisted venues across ${geo.city}, ${geo.state} (${geo.zip}) using OpenStreetMap, Wikipedia Geosearch, and US Business Registries.`
        }
      },
      {
        '@type': 'Question',
        name: `What are the latest US Census demographics for ZIP ${geo.zip}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Official US Census Bureau ACS 5-Year dataset provides total population, median household income, housing units, median home values, gross rent, poverty rates, and higher education attainment for ${geo.city}, ${geo.state} (${geo.zip}).`
        }
      },
      {
        '@type': 'Question',
        name: `How is the neighborhood vitality score calculated for ${geo.city}, ${geo.state}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The Neighborhood Vitality Index evaluates ${geo.city} on a 0–100 scale using a 5-axis model: commercial opening velocity, 5-year household income growth, housing occupancy rate, civic density, and dining/walkability.`
        }
      }
    ]
  };

  return (
    <>
      {/* Schema.org Structured Data for Googlebot */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Semantic Server-Rendered HTML for Crawlers & Indexation */}
      <section className="sr-only">
        <h1>What Changed in {geo.city}, {geo.state} ({geo.zip})</h1>
        <p>
          Real-time spatial intelligence, new store openings, business license filings, and US Census ACS demographic trajectory for {geo.city}, {geo.state} {geo.zip}.
        </p>
        <h2>Neighborhood Vitality and Census Metrics for {geo.city}, {geo.state}</h2>
        <ul>
          <li>Location: {geo.city}, {geo.state} {geo.zip} (Latitude: {geo.latitude}, Longitude: {geo.longitude})</li>
          <li>Data Sources: OpenStreetMap Overpass, Wikipedia Geosearch, api.usbusinesses.gov, and US Census Bureau ACS 5-Year API</li>
        </ul>
      </section>

      {/* Main Interactive Client Experience */}
      <AreaDashboardClient zip={zip} />
    </>
  );
}
