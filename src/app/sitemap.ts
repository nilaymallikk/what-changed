import type { MetadataRoute } from 'next';

// 120+ Key National Postal Hubs across all 50 US States
const NATIONAL_ZIPS = [
  // Mississippi
  '38863', '38668', '38655', '38801', '39201', '39501', '39401', '39042',
  // California
  '90210', '90001', '94102', '94103', '94107', '92101', '95113', '95814', '93721', '94612', '90802',
  // New York
  '10001', '10003', '10021', '11201', '11211', '11354', '10451', '14201', '12207', '14604', '13202',
  // Texas
  '78701', '78704', '77002', '77005', '75201', '75204', '78205', '79901', '76102', '78401', '79101',
  // Florida
  '33139', '33130', '32801', '33602', '32202', '33301', '33401', '32301', '33701', '32901',
  // Illinois & Midwest
  '60601', '60611', '60614', '60647', '60654', '62701', '46204', '48226', '43215', '44114', '45202', '53202',
  // Northwest & Mountain
  '98101', '98109', '97201', '97209', '80202', '80205', '84101', '83702', '89101', '89109', '89501', '59601',
  // Mid-Atlantic & South
  '20001', '20009', '21201', '19104', '19107', '15222', '23219', '27601', '28202', '29401', '29201', '30309', '30303', '37203', '38103', '40202',
  // New England
  '02138', '02116', '02903', '06103', '03101', '04101', '05401',
  // Plains & Southwest
  '63101', '64105', '68102', '50309', '55401', '55101', '67202', '73102', '74103', '72201', '70112', '70801', '85001', '85701', '87102', '96813', '99501'
];

const POPULAR_COMPARE_PAIRS = [
  '38863-vs-38668',
  '10001-vs-90210',
  '78701-vs-33139',
  '60611-vs-98101',
  '94102-vs-77005',
  '02138-vs-30309',
  '10003-vs-19104',
  '75201-vs-77002',
  '20001-vs-21201',
  '37203-vs-30309',
  '80202-vs-84101'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://whatchangedaround.me';
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
      url: `${baseUrl}/ai`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.90,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Dynamic area routes across all 50 US States
  const areaRoutes: MetadataRoute.Sitemap = NATIONAL_ZIPS.map((zip) => ({
    url: `${baseUrl}/area/${zip}`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // Dynamic head-to-head comparison routes
  const compareRoutes: MetadataRoute.Sitemap = POPULAR_COMPARE_PAIRS.map((pair) => ({
    url: `${baseUrl}/compare/${pair}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.80,
  }));

  return [...staticRoutes, ...areaRoutes, ...compareRoutes];
}
