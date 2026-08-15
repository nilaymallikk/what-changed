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
        title: 'Sweet Bean Coffee Roasters',
        description: 'New specialty coffee shop opened with outdoor patio seating.',
        old_data: null,
        new_data: {
          external_id: 'node/982103',
          name: 'Sweet Bean Coffee Roasters',
          category: 'Cafe & Coffee',
          address: '468 N Rodeo Dr, Beverly Hills, CA 90210',
          latitude: 34.0695,
          longitude: -118.4030,
          metadata: { cuisine: 'coffee_shop', phone: '+1 (310) 555-0192', opening_hours: 'Mo-Su 07:00-19:00' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-14T09:30:00Z',
        event_date: '2026-08-14T09:30:00Z',
        confidence: 0.98,
        significance_score: 85,
        verification_status: 'detected',
        created_at: '2026-08-14T09:30:00Z',
        is_demo: true
      },
      {
        id: 'demo_change_2',
        area_id: 'demo_area_90210',
        change_type: 'business_opened',
        entity_type: 'place',
        entity_id: 'way/451290',
        title: 'Equinox Beverly Hills Annex',
        description: 'New luxury fitness center added to map snapshot.',
        old_data: null,
        new_data: {
          external_id: 'way/451290',
          name: 'Equinox Beverly Hills Annex',
          category: 'Gym & Fitness',
          address: '450 N Bedford Dr, Beverly Hills, CA 90210',
          latitude: 34.0682,
          longitude: -118.4061,
          metadata: { leisure: 'fitness_centre', opening_hours: 'Mo-Su 05:00-23:00' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-11T14:15:00Z',
        event_date: '2026-08-11T14:15:00Z',
        confidence: 0.95,
        significance_score: 80,
        verification_status: 'detected',
        created_at: '2026-08-11T14:15:00Z',
        is_demo: true
      },
      {
        id: 'demo_change_3',
        area_id: 'demo_area_90210',
        change_type: 'business_modified',
        entity_type: 'place',
        entity_id: 'node/302918',
        title: 'Wilshire Wellness Pharmacy',
        description: 'Store updated name and extended operating hours to 24/7.',
        old_data: {
          external_id: 'node/302918',
          name: 'Beverly Hills Pharmacy',
          category: 'Pharmacy',
          address: '9600 Wilshire Blvd, Beverly Hills, CA 90212',
          latitude: 34.0668,
          longitude: -118.4045
        },
        new_data: {
          external_id: 'node/302918',
          name: 'Wilshire Wellness Pharmacy',
          category: 'Pharmacy',
          address: '9600 Wilshire Blvd Suite 101, Beverly Hills, CA 90212',
          latitude: 34.0668,
          longitude: -118.4045,
          metadata: { phone: '+1 (310) 555-4321', opening_hours: '24/7' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-07T11:00:00Z',
        event_date: '2026-08-07T11:00:00Z',
        confidence: 0.92,
        significance_score: 40,
        verification_status: 'detected',
        created_at: '2026-08-07T11:00:00Z',
        is_demo: true
      },
      {
        id: 'demo_change_4',
        area_id: 'demo_area_90210',
        change_type: 'business_removed',
        entity_type: 'place',
        entity_id: 'node/109283',
        title: 'Classic Hardware Store',
        description: 'No longer listed in the latest OpenStreetMap snapshot.',
        old_data: {
          external_id: 'node/109283',
          name: 'Classic Hardware Store',
          category: 'Retail (Hardware)',
          address: '9400 Wilshire Blvd, Beverly Hills, CA 90212',
          latitude: 34.0674,
          longitude: -118.4012,
          metadata: { shop: 'hardware' }
        },
        new_data: null,
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-03T16:45:00Z',
        event_date: '2026-08-03T16:45:00Z',
        confidence: 0.91,
        significance_score: 65,
        verification_status: 'detected',
        created_at: '2026-08-03T16:45:00Z',
        is_demo: true
      }
    ],
    aiSummary: {
      area_id: 'demo_area_90210',
      period_start: '2026-08-01T00:00:00Z',
      period_end: '2026-08-15T10:00:00Z',
      headline: 'Commercial retail & fitness additions in Beverly Hills',
      summary: 'Beverly Hills (90210) recorded two new business openings: Sweet Bean Coffee Roasters on N Rodeo Dr and Equinox Beverly Hills Annex on N Bedford Dr. Wilshire Wellness Pharmacy expanded operating hours, while Classic Hardware Store is no longer listed in the current snapshot.',
      highlights: [
        {
          title: 'New Coffee Roasters on Rodeo Dr',
          description: 'Sweet Bean Coffee Roasters opened at 468 N Rodeo Dr.',
          importance: 85,
          change_ids: ['demo_change_1']
        },
        {
          title: 'Equinox Annex Added to Map',
          description: 'New gym facilities added at 450 N Bedford Dr.',
          importance: 80,
          change_ids: ['demo_change_2']
        },
        {
          title: 'Hardware Listing Removed',
          description: 'Classic Hardware Store on Wilshire Blvd disappeared from latest snapshot.',
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
        title: 'Hudson Yards Market & Deli',
        description: 'New 24/7 gourmet grocery and deli opened.',
        old_data: null,
        new_data: {
          external_id: 'node/554901',
          name: 'Hudson Yards Market & Deli',
          category: 'Supermarket',
          address: '350 10th Ave, New York, NY 10001',
          latitude: 40.7522,
          longitude: -74.0005,
          metadata: { shop: 'deli', opening_hours: '24/7' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-13T10:00:00Z',
        event_date: '2026-08-13T10:00:00Z',
        confidence: 0.97,
        significance_score: 88,
        verification_status: 'detected',
        created_at: '2026-08-13T10:00:00Z',
        is_demo: true
      },
      {
        id: 'demo_ny_2',
        area_id: 'demo_area_10001',
        change_type: 'business_opened',
        entity_type: 'place',
        entity_id: 'node/554902',
        title: 'High Line Bistro',
        description: 'New French bistro added to map near Chelsea Park.',
        old_data: null,
        new_data: {
          external_id: 'node/554902',
          name: 'High Line Bistro',
          category: 'Restaurant',
          address: '220 10th Ave, New York, NY 10011',
          latitude: 40.7485,
          longitude: -74.0042,
          metadata: { amenity: 'restaurant', cuisine: 'french' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-10T15:30:00Z',
        event_date: '2026-08-10T15:30:00Z',
        confidence: 0.94,
        significance_score: 82,
        verification_status: 'detected',
        created_at: '2026-08-10T15:30:00Z',
        is_demo: true
      },
      {
        id: 'demo_ny_3',
        area_id: 'demo_area_10001',
        change_type: 'business_removed',
        entity_type: 'place',
        entity_id: 'node/441209',
        title: 'Penn Station Books',
        description: 'No longer listed in the latest OpenStreetMap snapshot.',
        old_data: {
          external_id: 'node/441209',
          name: 'Penn Station Books',
          category: 'Retail (Books)',
          address: '234 W 31st St, New York, NY 10001',
          latitude: 40.7495,
          longitude: -73.9940,
          metadata: { shop: 'books' }
        },
        new_data: null,
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-05T12:00:00Z',
        event_date: '2026-08-05T12:00:00Z',
        confidence: 0.92,
        significance_score: 60,
        verification_status: 'detected',
        created_at: '2026-08-05T12:00:00Z',
        is_demo: true
      }
    ],
    aiSummary: {
      area_id: 'demo_area_10001',
      period_start: '2026-08-01T00:00:00Z',
      period_end: '2026-08-15T10:00:00Z',
      headline: 'New culinary additions near Hudson Yards & High Line',
      summary: 'New York (10001) registered 2 new dining and market additions: Hudson Yards Market & Deli on 10th Ave and High Line Bistro on 10th Ave. Penn Station Books on W 31st St is no longer listed in the latest map snapshot.',
      highlights: [
        {
          title: 'New 24/7 Market on 10th Ave',
          description: 'Hudson Yards Market & Deli listed at 350 10th Ave.',
          importance: 88,
          change_ids: ['demo_ny_1']
        },
        {
          title: 'High Line Bistro Opened',
          description: 'French dining spot added at 220 10th Ave.',
          importance: 82,
          change_ids: ['demo_ny_2']
        }
      ],
      generated_at: '2026-08-15T10:05:00Z',
      model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      is_demo: true
    }
  },
  '33139': {
    area: {
      id: 'demo_area_33139',
      zip_code: '33139',
      city: 'Miami Beach',
      state: 'FL',
      country: 'USA',
      latitude: 25.7826,
      longitude: -80.1341,
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-15T10:00:00Z'
    },
    changes: [
      {
        id: 'demo_fl_1',
        area_id: 'demo_area_33139',
        change_type: 'business_opened',
        entity_type: 'place',
        entity_id: 'node/771092',
        title: 'Ocean Drive Gelato & Lounge',
        description: 'New beachfront cafe and lounge added to map.',
        old_data: null,
        new_data: {
          external_id: 'node/771092',
          name: 'Ocean Drive Gelato & Lounge',
          category: 'Cafe & Coffee',
          address: '1020 Ocean Dr, Miami Beach, FL 33139',
          latitude: 25.7805,
          longitude: -80.1308,
          metadata: { amenity: 'cafe', outdoor_seating: 'yes' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-12T16:20:00Z',
        event_date: '2026-08-12T16:20:00Z',
        confidence: 0.96,
        significance_score: 84,
        verification_status: 'detected',
        created_at: '2026-08-12T16:20:00Z',
        is_demo: true
      },
      {
        id: 'demo_fl_2',
        area_id: 'demo_area_33139',
        change_type: 'business_modified',
        entity_type: 'place',
        entity_id: 'node/771093',
        title: 'Lincoln Road Surf Shop',
        description: 'Store updated name and added online website.',
        old_data: {
          external_id: 'node/771093',
          name: 'Miami Surf Store',
          category: 'Retail (Apparel)',
          address: '800 Lincoln Rd, Miami Beach, FL 33139',
          latitude: 25.7906,
          longitude: -80.1355
        },
        new_data: {
          external_id: 'node/771093',
          name: 'Lincoln Road Surf Shop',
          category: 'Retail (Apparel)',
          address: '800 Lincoln Rd, Miami Beach, FL 33139',
          latitude: 25.7906,
          longitude: -80.1355,
          metadata: { website: 'https://lincolnroadsurf.com' }
        },
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        detected_at: '2026-08-08T11:30:00Z',
        event_date: '2026-08-08T11:30:00Z',
        confidence: 0.93,
        significance_score: 38,
        verification_status: 'detected',
        created_at: '2026-08-08T11:30:00Z',
        is_demo: true
      }
    ],
    aiSummary: {
      area_id: 'demo_area_33139',
      period_start: '2026-08-01T00:00:00Z',
      period_end: '2026-08-15T10:00:00Z',
      headline: 'Ocean Drive beachfront cafe opening in South Beach',
      summary: 'Miami Beach (33139) registered Ocean Drive Gelato & Lounge at 1020 Ocean Dr along with branding updates for Lincoln Road Surf Shop.',
      highlights: [
        {
          title: 'Gelato Lounge on Ocean Dr',
          description: 'New cafe listed at 1020 Ocean Dr.',
          importance: 84,
          change_ids: ['demo_fl_1']
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
