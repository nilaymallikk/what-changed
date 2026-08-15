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
    const title = `What Changed in ${geo.city}, ${geo.state} (${geo.zip})`;
    const description = `Explore recent store openings, unlisted businesses, building modifications, and 10-year Census demographic shifts in ${geo.city}, ${geo.state} (${geo.zip}).`;
    const url = `https://whatchangedaround.me/area/${geo.zip}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      keywords: [
        `${geo.city} neighborhood changes`,
        `${geo.city} new businesses`,
        `${geo.zip} census data`,
        `what changed in ${geo.city}`,
        `${geo.city} real estate trends`
      ],
      openGraph: {
        title: `${title} | What Changed Around Me`,
        description,
        url,
        siteName: 'What Changed Around Me',
        type: 'website',
        images: ['/architecture.png'],
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
      title: `What Changed Around ZIP ${zip}`,
      description: `Neighborhood commercial and demographic intelligence for US ZIP code ${zip}.`,
      alternates: {
        canonical: url,
      },
    };
  }
}

export default async function AreaPage({ params }: PageProps) {
  const { zip } = await params;
  return <AreaDashboardClient zip={zip} />;
}
