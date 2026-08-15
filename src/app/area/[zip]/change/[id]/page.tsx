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
    const url = `https://whatchangedaround.me/area/${geo.zip}/change/${id}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: `${title} | What Changed Around Me`,
        description,
        url,
        siteName: 'What Changed Around Me',
        type: 'article',
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
    const url = `https://whatchangedaround.me/area/${zip}/change/${id}`;
    return {
      title: `Change Event Details (${id})`,
      description: `Detailed change event inspection on What Changed Around Me.`,
      alternates: {
        canonical: url,
      },
    };
  }
}

export default async function ChangePage({ params }: PageProps) {
  const { zip, id } = await params;
  return <ChangeDetailClient zip={zip} id={id} />;
}
