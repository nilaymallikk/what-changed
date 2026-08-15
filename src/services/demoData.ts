import type { Area, Change, AISummary } from '../types';


export interface DemoDataset {
  area: Area;
  changes: Change[];
  aiSummary: AISummary;
}

export const DEMO_DATASETS: Record<string, DemoDataset> = {
  '90210': {
    area: {
      id: 'demo_area_90210',
      zip_code: '90210',
      city: 'Beverly Hills',
      state: 'CA',
      country: 'USA',
      latitude: 34.0736,
      longitude: -118.4004,
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-15T10:00:00Z'
    },
    changes: [
      {
        id: 'demo_change_1',
        area_id: 'demo_area_90210',
        change_type: 'business_opened',
        entity_type: 'place',
        entity_id: 'node/982103',
        title: 'Sweet Bean Coffee',
        description: 'New artisanal cafe appeared at 812 Rodeo Drive with outdoor seating.',
        old_data: null,
        new_data: {
          external_id: 'node/982103',
          name: 'Sweet Bean Coffee',
          category: 'Cafe',
          address: '812 Rodeo Drive',
          latitude: 34.0695,
          longitude: -118.4030,
          metadata: { cuisine: 'coffee_shop', seating: 'outdoor', phone: '+1 310-555-0192' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-15T09:30:00Z',
        event_date: '2026-08-15T09:30:00Z',
        confidence: 0.96,
        significance_score: 82,
        verification_status: 'detected',
        created_at: '2026-08-15T09:30:00Z',
        is_demo: true
      },
      {
        id: 'demo_change_2',
        area_id: 'demo_area_90210',
        change_type: 'business_opened',
        entity_type: 'place',
        entity_id: 'way/451290',
        title: 'FitLab Elite',
        description: 'New premium fitness centre added at 450 N Bedford Dr.',
        old_data: null,
        new_data: {
          external_id: 'way/451290',
          name: 'FitLab Elite',
          category: 'Gym',
          address: '450 N Bedford Dr',
          latitude: 34.0682,
          longitude: -118.4061,
          metadata: { leisure: 'fitness_centre', opening_hours: 'Mo-Su 05:00-23:00' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-12T14:15:00Z',
        event_date: '2026-08-12T14:15:00Z',
        confidence: 0.94,
        significance_score: 78,
        verification_status: 'detected',
        created_at: '2026-08-12T14:15:00Z',
        is_demo: true
      },
      {
        id: 'demo_change_3',
        area_id: 'demo_area_90210',
        change_type: 'business_modified',
        entity_type: 'place',
        entity_id: 'node/302918',
        title: 'Beverly Hills Pharmacy',
        description: 'Updated operating hours and added contact phone details.',
        old_data: {
          name: 'Beverly Hills Pharmacy',
          address: '9600 Wilshire Blvd',
          category: 'Pharmacy',
          latitude: 34.0668,
          longitude: -118.4045
        },
        new_data: {
          name: 'Beverly Hills Pharmacy & Wellness',
          address: '9600 Wilshire Blvd Suite 101',
          category: 'Pharmacy',
          latitude: 34.0668,
          longitude: -118.4045,
          metadata: { phone: '+1 310-555-4321', opening_hours: '24/7' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-08T11:00:00Z',
        event_date: '2026-08-08T11:00:00Z',
        confidence: 0.91,
        significance_score: 35,
        verification_status: 'detected',
        created_at: '2026-08-08T11:00:00Z',
        is_demo: true
      },
      {
        id: 'demo_change_4',
        area_id: 'demo_area_90210',
        change_type: 'business_removed',
        entity_type: 'place',
        entity_id: 'node/109283',
        title: 'ABC Hardware',
        description: 'ABC Hardware is no longer listed in the latest OpenStreetMap snapshot.',
        old_data: {
          external_id: 'node/109283',
          name: 'ABC Hardware',
          category: 'Shop',
          address: '9400 Wilshire Blvd',
          latitude: 34.0674,
          longitude: -118.4012,
          metadata: { shop: 'hardware' }
        },
        new_data: null,
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-02T16:45:00Z',
        event_date: '2026-08-02T16:45:00Z',
        confidence: 0.89,
        significance_score: 65,
        verification_status: 'detected',
        created_at: '2026-08-02T16:45:00Z',
        is_demo: true
      }
    ],
    aiSummary: {
      area_id: 'demo_area_90210',
      period_start: '2026-08-01T00:00:00Z',
      period_end: '2026-08-15T10:00:00Z',
      headline: 'Commercial expansion in Beverly Hills: 2 new openings',
      summary: 'Beverly Hills (90210) saw moderate commercial activity this month. Two new high-end establishments (Sweet Bean Coffee and FitLab Elite) appeared in OSM snapshots. Meanwhile, ABC Hardware is no longer listed in the latest snapshot.',
      highlights: [
        {
          title: 'New Artisanal Cafe on Rodeo Drive',
          description: 'Sweet Bean Coffee opened with outdoor seating.',
          importance: 82,
          change_ids: ['demo_change_1']
        },
        {
          title: 'New Gym Opening on Bedford Dr',
          description: 'FitLab Elite fitness center added to map.',
          importance: 78,
          change_ids: ['demo_change_2']
        },
        {
          title: 'Hardware Store No Longer Listed',
          description: 'ABC Hardware disappeared from latest OpenStreetMap snapshot.',
          importance: 65,
          change_ids: ['demo_change_4']
        }
      ],
      generated_at: '2026-08-15T10:05:00Z',
      model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      is_demo: true
    }
  },
  '10001': {
    area: {
      id: 'demo_area_10001',
      zip_code: '10001',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      latitude: 40.7501,
      longitude: -73.9996,
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-15T10:00:00Z'
    },
    changes: [
      {
        id: 'demo_ny_1',
        area_id: 'demo_area_10001',
        change_type: 'business_opened',
        entity_type: 'place',
        entity_id: 'node/554901',
        title: 'Hudson Yard Deli',
        description: 'New gourmet deli added at 350 10th Ave.',
        old_data: null,
        new_data: {
          external_id: 'node/554901',
          name: 'Hudson Yard Deli',
          category: 'Supermarket',
          address: '350 10th Ave',
          latitude: 40.7522,
          longitude: -74.0005,
          metadata: { shop: 'deli', opening_hours: '24/7' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-14T10:00:00Z',
        event_date: '2026-08-14T10:00:00Z',
        confidence: 0.95,
        significance_score: 85,
        verification_status: 'detected',
        created_at: '2026-08-14T10:00:00Z',
        is_demo: true
      },
      {
        id: 'demo_ny_2',
        area_id: 'demo_area_10001',
        change_type: 'business_removed',
        entity_type: 'place',
        entity_id: 'node/441209',
        title: 'Penn Station Books',
        description: 'Penn Station Books is no longer listed in the latest OpenStreetMap snapshot.',
        old_data: {
          external_id: 'node/441209',
          name: 'Penn Station Books',
          category: 'Shop',
          address: '234 W 31st St',
          latitude: 40.7495,
          longitude: -73.9940,
          metadata: { shop: 'books' }
        },
        new_data: null,
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-06T12:00:00Z',
        event_date: '2026-08-06T12:00:00Z',
        confidence: 0.92,
        significance_score: 60,
        verification_status: 'detected',
        created_at: '2026-08-06T12:00:00Z',
        is_demo: true
      }
    ],
    aiSummary: {
      area_id: 'demo_area_10001',
      period_start: '2026-08-01T00:00:00Z',
      period_end: '2026-08-15T10:00:00Z',
      headline: 'Midtown Manhattan retail updates',
      summary: 'New York (10001) registered 1 new deli opening near Hudson Yards while Penn Station Books is no longer present in the latest snapshot.',
      highlights: [
        {
          title: 'New Deli on 10th Ave',
          description: 'Hudson Yard Deli listed as open 24/7.',
          importance: 85,
          change_ids: ['demo_ny_1']
        }
      ],
      generated_at: '2026-08-15T10:05:00Z',
      model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      is_demo: true
    }
  }
};

export function getDemoData(zip: string): DemoDataset | null {
  return DEMO_DATASETS[zip.trim()] || null;
}
