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

    const title = `${geoA.city}, ${geoA.state} (${geoA.zip}) vs ${geoB.city}, ${geoB.state} (${geoB.zip}) Comparison`;
    const description = `Side-by-side neighborhood comparison of ${geoA.city} vs ${geoB.city}. Compare commercial opening velocities, 10-year Census shifts, and economic Vitality Scores.`;

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
    return {
      title: `Neighborhood Comparison: ZIP ${zipA} vs ${zipB}`,
      description: `Side-by-side comparison of US ZIP codes on What Changed Around Me.`,
      alternates: {
        canonical: url,
      },
    };
  }
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  return <CompareClient slug={slug} />;
}
