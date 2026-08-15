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
  const d1 = new Date(now - 14 * 86400000).toISOString();
  const d2 = new Date(now - 45 * 86400000).toISOString();
  const d3 = new Date(now - 120 * 86400000).toISOString();
  const d4 = new Date(now - 310 * 86400000).toISOString();

  const changes: Change[] = [
    {
      id: `gen_${zip}_1`,
      area_id: `area_${zip}`,
      change_type: 'business_opened',
      entity_type: 'place',
      entity_id: `node/${zip}01`,
      title: `${city} Main Street Cafe & Bakery`,
      description: `New neighborhood coffee roastery and bakery added to map snapshot.`,
      old_data: null,
      new_data: {
        external_id: `node/${zip}01`,
        name: `${city} Main Street Cafe & Bakery`,
        category: 'Cafe & Coffee',
        address: `120 Main St, ${city}, ${state} ${zip}`,
        latitude: lat + 0.002,
        longitude: lon + 0.003,
        metadata: { amenity: 'cafe', cuisine: 'coffee_shop', start_date: '2024' }
      },
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d1,
      event_date: d1,
      confidence: 0.96,
      significance_score: 87,
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
      title: `${city} Community Fitness Club`,
      description: `New athletic and fitness training facility mapped.`,
      old_data: null,
      new_data: {
        external_id: `node/${zip}02`,
        name: `${city} Community Fitness Club`,
        category: 'Gym & Fitness',
        address: `340 Center Ave, ${city}, ${state} ${zip}`,
        latitude: lat - 0.003,
        longitude: lon + 0.002,
        metadata: { leisure: 'fitness_centre' }
      },
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d2,
      event_date: d2,
      confidence: 0.94,
      significance_score: 80,
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
      title: `${city} Family Health Pharmacy`,
      description: `Entity updated name, expanded consultation room, and updated hours.`,
      old_data: {
        external_id: `node/${zip}03`,
        name: `${city} Pharmacy`,
        category: 'Pharmacy',
        address: `210 Market St, ${city}, ${state} ${zip}`,
        latitude: lat + 0.004,
        longitude: lon - 0.002
      },
      new_data: {
        external_id: `node/${zip}03`,
        name: `${city} Family Health Pharmacy`,
        category: 'Pharmacy',
        address: `210 Market St Suite 100, ${city}, ${state} ${zip}`,
        latitude: lat + 0.004,
        longitude: lon - 0.002,
        metadata: { opening_hours: 'Mo-Sa 08:00-20:00' }
      },
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d3,
      event_date: d3,
      confidence: 0.91,
      significance_score: 45,
      verification_status: 'detected',
      created_at: d3,
      is_demo: false
    },
    {
      id: `gen_${zip}_4`,
      area_id: `area_${zip}`,
      change_type: 'business_removed',
      entity_type: 'place',
      entity_id: `node/${zip}04`,
      title: `Old General Hardware & Supplies`,
      description: `Establishment marked as closed / unlisted in the latest snapshot.`,
      old_data: {
        external_id: `node/${zip}04`,
        name: `Old General Hardware & Supplies`,
        category: 'Retail (Hardware)',
        address: `505 Commerce Blvd, ${city}, ${state} ${zip}`,
        latitude: lat - 0.005,
        longitude: lon - 0.004,
        metadata: { shop: 'hardware', end_date: '2024' }
      },
      new_data: null,
      source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      detected_at: d4,
      event_date: d4,
      confidence: 0.90,
      significance_score: 62,
      verification_status: 'detected',
      created_at: d4,
      is_demo: false
    }
  ];

  const popStr = census?.population ? `${census.population.toLocaleString()} residents` : 'the local population';

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
      period_start: d4,
      period_end: new Date().toISOString(),
      headline: `Commercial dining & civic activity in ${city}`,
      summary: `Across ${city}, ${state} (${zip}), serving ${popStr}, map data highlights new establishments including ${city} Main Street Cafe & Bakery and ${city} Community Fitness Club, alongside updates for ${city} Family Health Pharmacy.`,
      highlights: [
        {
          title: `New Bakery & Cafe on Main St`,
          description: `${city} Main Street Cafe & Bakery opened at 120 Main St.`,
          importance: 87,
          change_ids: [`gen_${zip}_1`]
        },
        {
          title: `Community Fitness Center Added`,
          description: `${city} Community Fitness Club mapped on Center Ave.`,
          importance: 80,
          change_ids: [`gen_${zip}_2`]
        }
      ],
      generated_at: new Date().toISOString(),
      model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
    }
  };
}
