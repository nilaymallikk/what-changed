import { BaseDataProvider, type FetchResult, type NormalizedPlace } from './BaseProvider';
import { wikipediaProvider } from './WikipediaProvider';

export class OverpassProvider extends BaseDataProvider {
  readonly id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  readonly name = 'OpenStreetMap';
  readonly sourceType = 'osm_overpass';
  readonly url = 'https://www.openstreetmap.org/';
  readonly description = 'Community-driven map data queried via Overpass API';

  private endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  async fetchNearbyData(lat: number, lon: number, radiusMeters: number = 3500): Promise<FetchResult> {
    // High-precision Overpass QL query capturing POIs, active & disused establishments with full metadata (timestamp, version, user)
    const query = `
[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food|bar|pub|bank|pharmacy|clinic|hospital|school|college|kindergarten|cinema|theatre|library|post_office|community_centre"]["name"](around:${radiusMeters},${lat},${lon});
  way["amenity"~"restaurant|cafe|fast_food|bar|pub|bank|pharmacy|clinic|hospital|school|college|kindergarten|cinema|theatre|library|post_office|community_centre"]["name"](around:${radiusMeters},${lat},${lon});
  
  node["shop"]["name"](around:${radiusMeters},${lat},${lon});
  way["shop"]["name"](around:${radiusMeters},${lat},${lon});
  
  node["leisure"~"fitness_centre|gym|sports_centre|park|playground|stadium"]["name"](around:${radiusMeters},${lat},${lon});
  way["leisure"~"fitness_centre|gym|sports_centre|park|playground|stadium"]["name"](around:${radiusMeters},${lat},${lon});
  
  node["tourism"~"hotel|hostel|motel|museum|attraction|gallery"]["name"](around:${radiusMeters},${lat},${lon});
  way["tourism"~"hotel|hostel|motel|museum|attraction|gallery"]["name"](around:${radiusMeters},${lat},${lon});
  
  node["office"]["name"](around:${radiusMeters},${lat},${lon});
  way["office"]["name"](around:${radiusMeters},${lat},${lon});

  node["disused:amenity"]["name"](around:${radiusMeters},${lat},${lon});
  way["disused:amenity"]["name"](around:${radiusMeters},${lat},${lon});

  node["disused:shop"]["name"](around:${radiusMeters},${lat},${lon});
  way["disused:shop"]["name"](around:${radiusMeters},${lat},${lon});

  node["closed"="yes"]["name"](around:${radiusMeters},${lat},${lon});
  way["closed"="yes"]["name"](around:${radiusMeters},${lat},${lon});

  node["abandoned:amenity"]["name"](around:${radiusMeters},${lat},${lon});
  way["abandoned:amenity"]["name"](around:${radiusMeters},${lat},${lon});
);
out center meta 250;
`;

    let lastError: Error | null = null;
    let elements: any[] = [];

    // Try primary and fallback mirrors
    for (const endpoint of this.endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'WhatChangedAroundMe/2.0 (contact@whatchanged.app)'
          },
          body: `data=${encodeURIComponent(query)}`
        });

        if (response.ok) {
          const data = await response.json();
          elements = data.elements || [];
          if (elements.length > 0) {
            break;
          }
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    // Process OSM elements
    const osmPlaces: NormalizedPlace[] = elements
      .filter((el: any) => el.tags && (el.tags.name || el.tags['brand'] || el.tags['official_name'] || el.tags['old_name']))
      .map((el: any) => this.normalizeOSMElement(el));

    // Also fetch Wikipedia civic/historical landmarks to enrich data
    let wikiPlaces: NormalizedPlace[] = [];
    try {
      const wikiResult = await wikipediaProvider.fetchNearbyData(lat, lon, radiusMeters);
      wikiPlaces = wikiResult.places || [];
    } catch {
      // Non-blocking
    }

    // Merge and deduplicate by external_id
    const combined = [...osmPlaces, ...wikiPlaces];

    if (combined.length === 0 && lastError) {
      console.warn("Overpass failed and no Wikipedia places found:", lastError);
    }

    return {
      sourceName: this.name,
      sourceType: this.sourceType,
      places: combined,
      rawCount: combined.length,
      timestamp: new Date().toISOString()
    };
  }

  private normalizeOSMElement(el: any): NormalizedPlace {
    const tags = el.tags || {};
    const external_id = `${el.type}/${el.id}`;
    const name = tags.name || tags['brand'] || tags['official_name'] || tags['old_name'] || 'Unnamed Place';

    const latitude = el.lat || (el.center ? el.center.lat : 0);
    const longitude = el.lon || (el.center ? el.center.lon : 0);

    const isDisused = Boolean(
      tags['disused:amenity'] ||
      tags['disused:shop'] ||
      tags.closed === 'yes' ||
      tags['abandoned:amenity'] ||
      tags.disused === 'yes' ||
      tags.end_date
    );

    let category = 'Business & Services';
    const rawAmenity = tags.amenity || tags['disused:amenity'] || tags['abandoned:amenity'];
    const rawShop = tags.shop || tags['disused:shop'];

    if (rawAmenity) {
      category = this.mapCategory(rawAmenity);
    } else if (rawShop) {
      category = rawShop === 'supermarket' ? 'Supermarket' : `Retail (${rawShop.replace('_', ' ')})`;
    } else if (tags.leisure) {
      category = tags.leisure === 'fitness_centre' ? 'Gym & Fitness' : 'Recreation';
    } else if (tags.tourism) {
      category = 'Hotel & Tourism';
    } else if (tags.office) {
      category = 'Office';
    }

    if (isDisused) {
      category += ' (Closed / Disused)';
    }

    // Precise address extraction from OSM tags
    const num = tags['addr:housenumber'] || '';
    const street = tags['addr:street'] || tags['addr:place'] || '';
    const unit = tags['addr:unit'] ? `Suite ${tags['addr:unit']}` : '';
    const city = tags['addr:city'] || '';
    const state = tags['addr:state'] || '';
    const zip = tags['addr:postcode'] || '';

    let formattedAddr = '';
    if (num && street) {
      formattedAddr = `${num} ${street}${unit ? ' ' + unit : ''}`;
    } else if (street) {
      formattedAddr = street;
    } else if (tags['addr:full']) {
      formattedAddr = tags['addr:full'];
    } else {
      formattedAddr = city && state ? `Located in ${city}, ${state}` : 'Street address pending map survey';
    }

    if (city && state && !formattedAddr.includes(city)) {
      formattedAddr += `, ${city}, ${state} ${zip}`.trim();
    }

    const osmTimestamp = el.timestamp || tags['survey:date'] || tags['check_date'] || new Date().toISOString();
    const osmVersion = typeof el.version === 'number' ? el.version : 1;

    return {
      external_id,
      name,
      category,
      address: formattedAddr,
      latitude,
      longitude,
      timestamp: osmTimestamp,
      version: osmVersion,
      user: el.user,
      status: isDisused ? 'closed' : 'active',
      metadata: {
        osm_type: el.type,
        osm_id: el.id,
        osm_version: osmVersion,
        osm_timestamp: osmTimestamp,
        osm_user: el.user,
        osm_changeset: el.changeset,
        start_date: tags.start_date || tags.opening_date,
        end_date: tags.end_date,
        old_name: tags.old_name || tags['disused:name'] || tags['was:name'],
        cuisine: tags.cuisine,
        opening_hours: tags.opening_hours,
        phone: tags.phone || tags['contact:phone'],
        website: tags.website || tags['contact:website'],
        brand: tags.brand,
        wheelchair: tags.wheelchair,
        raw_tags: tags
      }
    };
  }

  private mapCategory(amenity: string): string {
    const map: Record<string, string> = {
      restaurant: 'Restaurant',
      cafe: 'Cafe & Coffee',
      fast_food: 'Fast Food',
      bar: 'Bar & Pub',
      pub: 'Bar & Pub',
      bank: 'Bank & Financial',
      pharmacy: 'Pharmacy',
      clinic: 'Healthcare Clinic',
      hospital: 'Hospital',
      school: 'School',
      college: 'College / University',
      kindergarten: 'Preschool',
      cinema: 'Cinema',
      theatre: 'Theatre & Arts',
      library: 'Public Library'
    };
    return map[amenity] || 'Business & Services';
  }
}

export const overpassProvider = new OverpassProvider();
