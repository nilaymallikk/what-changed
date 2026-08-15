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

    return {
      title,
      description,
      openGraph: {
        title: `${title} | What Changed Around Me`,
        description,
        url: `https://whatchanged.io/area/${geo.zip}`,
        siteName: 'What Changed Around Me',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      }
    };
  } catch {
    return {
      title: `What Changed Around ZIP ${zip}`,
      description: `Neighborhood commercial and demographic intelligence for US ZIP code ${zip}.`,
    };
  }
}

export default async function AreaPage({ params }: PageProps) {
  const { zip } = await params;
  return <AreaDashboardClient zip={zip} />;
}
