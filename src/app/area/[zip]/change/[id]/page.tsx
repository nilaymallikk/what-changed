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
    const title = `Place Change Details (${id}) - ${geo.city}, ${geo.state} ${geo.zip}`;
    const description = `Inspect verified physical and commercial changes, historical diffs, and confidence metrics for record ${id} in ${geo.city}, ${geo.state}.`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | What Changed Around Me`,
        description,
        url: `https://whatchanged.io/area/${geo.zip}/change/${id}`,
        siteName: 'What Changed Around Me',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      }
    };
  } catch {
    return {
      title: `Change Event Details (${id})`,
      description: `Detailed change event inspection on What Changed Around Me.`,
    };
  }
}

export default async function ChangePage({ params }: PageProps) {
  const { zip, id } = await params;
  return <ChangeDetailClient zip={zip} id={id} />;
}
