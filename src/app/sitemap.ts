import type { MetadataRoute } from 'next';

const POPULAR_ZIPS = [
  '10001', '10003', '90210', '94102', '33139', '77005', 
  '60611', '78701', '98101', '02138', '30309', '19104',
  '97209', '55401', '48226', '80202', '20001', '92101'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://whatchanged.io';
  const lastModified = new Date();

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/data-sources`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic area routes for indexing
  const areaRoutes: MetadataRoute.Sitemap = POPULAR_ZIPS.map((zip) => ({
    url: `${baseUrl}/area/${zip}`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...areaRoutes];
}
