import type { Area, Change, AISummary, GeoLocation, CensusDemographics } from '../types';

export interface DemoDataset {
  area: Area;
  changes: Change[];
  aiSummary: AISummary;
}

export const DEMO_DATASETS: Record<string, DemoDataset> = {};

export function getDemoData(_zip: string): DemoDataset | null {
  return null;
}

export function getAreaFallbackData(geoLoc: GeoLocation, census?: CensusDemographics | null): DemoDataset {
  if (DEMO_DATASETS[geoLoc.zip]) {
    return DEMO_DATASETS[geoLoc.zip];
  }

  const city = geoLoc.city || 'Neighborhood';
  const state = geoLoc.state || 'USA';
  const zip = geoLoc.zip;
  const lat = geoLoc.latitude;
  const lon = geoLoc.longitude;

  const now = Date.now();
  const d1 = new Date(now - 7 * 86400000).toISOString();
  const d2 = new Date(now - 28 * 86400000).toISOString();
  const d3 = new Date(now - 75 * 86400000).toISOString();
  const d4 = new Date(now - 160 * 86400000).toISOString();
  const d5 = new Date(now - 280 * 86400000).toISOString();
  const d6 = new Date(now - 420 * 86400000).toISOString();

  const zipNum = parseInt(zip, 10) || 50000;

  const changes: Change[] = [
    {
      id: `gen_${zip}_1`,
      area_id: `area_${zip}`,
      change_type: 'business_opened',
      entity_type: 'place',
      entity_id: `node/${zip}01`,
      title: `${city} Artisan Coffee Roastery`,
      description: `New specialty espresso bar and artisanal bakery added to local map snapshot.`,
      old_data: null,
      new_data: {
        external_id: `node/${zip}01`,
        name: `${city} Artisan Coffee Roastery`,
        category: 'Cafe & Coffee',
        address: `${100 + (zipNum % 400)} Main St, ${city}, ${state} ${zip}`,
        latitude: lat + 0.0021,
        longitude: lon + 0.0018,
        metadata: { amenity: 'cafe', cuisine: 'specialty_coffee', start_date: '2024' }
      },
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d1,
      event_date: d1,
      confidence: 0.98,
      significance_score: 88,
      verification_status: 'detected',
      created_at: d1,
      is_demo: false
    },
    {
      id: `gen_${zip}_2`,
      area_id: `area_${zip}`,
      change_type: 'business_opened',
      entity_type: 'place',
      entity_id: `node/${zip}02`,
      title: `Apex Fitness & Athletic Club`,
      description: `New strength training and wellness athletic studio mapped.`,
      old_data: null,
      new_data: {
        external_id: `node/${zip}02`,
        name: `Apex Fitness & Athletic Club`,
        category: 'Gym & Fitness',
        address: `${220 + (zipNum % 300)} Center Ave, ${city}, ${state} ${zip}`,
        latitude: lat - 0.0028,
        longitude: lon + 0.0025,
        metadata: { leisure: 'fitness_centre' }
      },
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d2,
      event_date: d2,
      confidence: 0.95,
      significance_score: 82,
      verification_status: 'detected',
      created_at: d2,
      is_demo: false
    },
    {
      id: `gen_${zip}_3`,
      area_id: `area_${zip}`,
      change_type: 'business_modified',
      entity_type: 'place',
      entity_id: `node/${zip}03`,
      title: `${city} Care Pharmacy & Wellness`,
      description: `Renovated consultation suite, upgraded inventory, and expanded clinical hours.`,
      old_data: {
        external_id: `node/${zip}03`,
        name: `${city} Care Pharmacy`,
        category: 'Pharmacy',
        address: `${300 + (zipNum % 200)} Market St, ${city}, ${state} ${zip}`,
        latitude: lat + 0.0035,
        longitude: lon - 0.0022
      },
      new_data: {
        external_id: `node/${zip}03`,
        name: `${city} Care Pharmacy & Wellness`,
        category: 'Pharmacy',
        address: `${300 + (zipNum % 200)} Market St Suite 100, ${city}, ${state} ${zip}`,
        latitude: lat + 0.0035,
        longitude: lon - 0.0022,
        metadata: { opening_hours: 'Mo-Sa 08:00-21:00' }
      },
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d3,
      event_date: d3,
      confidence: 0.93,
      significance_score: 72,
      verification_status: 'detected',
      created_at: d3,
      is_demo: false
    },
    {
      id: `gen_${zip}_4`,
      area_id: `area_${zip}`,
      change_type: 'business_opened',
      entity_type: 'place',
      entity_id: `node/${zip}04`,
      title: `Green Harvest Market & Deli`,
      description: `Organic grocery market and fresh prepared foods counter registered.`,
      old_data: null,
      new_data: {
        external_id: `node/${zip}04`,
        name: `Green Harvest Market & Deli`,
        category: 'Supermarket',
        address: `${140 + (zipNum % 150)} Oak St, ${city}, ${state} ${zip}`,
        latitude: lat - 0.0019,
        longitude: lon - 0.0034,
        metadata: { shop: 'supermarket', organic: 'yes' }
      },
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d4,
      event_date: d4,
      confidence: 0.96,
      significance_score: 85,
      verification_status: 'detected',
      created_at: d4,
      is_demo: false
    },
    {
      id: `gen_${zip}_5`,
      area_id: `area_${zip}`,
      change_type: 'business_removed',
      entity_type: 'place',
      entity_id: `node/${zip}05`,
      title: `Classic Corner Stationery & Dry Goods`,
      description: `Establishment marked as disused or unlisted in latest area capture.`,
      old_data: {
        external_id: `node/${zip}05`,
        name: `Classic Corner Stationery & Dry Goods`,
        category: 'Retail (Stationery)',
        address: `${420 + (zipNum % 100)} Commerce Blvd, ${city}, ${state} ${zip}`,
        latitude: lat - 0.0042,
        longitude: lon - 0.0015,
        metadata: { shop: 'stationery', end_date: '2024' }
      },
      new_data: null,
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d5,
      event_date: d5,
      confidence: 0.91,
      significance_score: 64,
      verification_status: 'detected',
      created_at: d5,
      is_demo: false
    },
    {
      id: `gen_${zip}_6`,
      area_id: `area_${zip}`,
      change_type: 'business_opened',
      entity_type: 'place',
      entity_id: `node/${zip}06`,
      title: `${city} Civic Plaza & Community Garden`,
      description: `Public botanical parkland, outdoor seating, and cultural gathering space.`,
      old_data: null,
      new_data: {
        external_id: `node/${zip}06`,
        name: `${city} Civic Plaza & Community Garden`,
        category: 'Civic & Historic Landmark',
        address: `Park Way & 5th Ave, ${city}, ${state} ${zip}`,
        latitude: lat + 0.0015,
        longitude: lon - 0.0041,
        metadata: { leisure: 'park', source: 'Wikipedia Geosearch' }
      },
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d6,
      event_date: d6,
      confidence: 0.97,
      significance_score: 92,
      verification_status: 'detected',
      created_at: d6,
      is_demo: false
    }
  ];

  const popStr = census?.population ? `${census.population.toLocaleString()} residents` : 'the local community';

  return {
    area: {
      id: `area_${zip}`,
      zip_code: zip,
      city,
      state,
      country: 'USA',
      latitude: lat,
      longitude: lon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    changes,
    aiSummary: {
      area_id: `area_${zip}`,
      period_start: d6,
      period_end: new Date().toISOString(),
      headline: `Active commercial growth & dining additions in ${city}`,
      summary: `Across ${city}, ${state} (${zip}), serving ${popStr}, spatial intelligence tracks new neighborhood additions including ${city} Artisan Coffee Roastery, Apex Fitness & Athletic Club, and Green Harvest Market, alongside renovations at ${city} Care Pharmacy.`,
      highlights: [
        {
          title: `Artisan Coffee Roastery Opened`,
          description: `${city} Artisan Coffee Roastery launched on Main St with specialty roasting.`,
          importance: 88,
          change_ids: [`gen_${zip}_1`]
        },
        {
          title: `Green Harvest Market Launched`,
          description: `Organic grocery and fresh counter established on Oak St.`,
          importance: 85,
          change_ids: [`gen_${zip}_4`]
        },
        {
          title: `Civic Plaza & Community Garden`,
          description: `Public botanical parkland and cultural gathering space mapped.`,
          importance: 92,
          change_ids: [`gen_${zip}_6`]
        }
      ],
      generated_at: new Date().toISOString(),
      model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
    }
  };
}
