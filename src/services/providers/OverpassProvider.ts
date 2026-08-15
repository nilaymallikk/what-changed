import { BaseDataProvider, type FetchResult, type NormalizedPlace } from './BaseProvider';

export class OverpassProvider extends BaseDataProvider {
  readonly id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  readonly name = 'OpenStreetMap';
  readonly sourceType = 'osm_overpass';
  readonly url = 'https://www.openstreetmap.org/';
  readonly description = 'Community-driven map data queried via Overpass API';

  private endpoint = 'https://overpass-api.de/api/interpreter';

  async fetchNearbyData(lat: number, lon: number, radiusMeters: number = 1500): Promise<FetchResult> {
    // High-precision Overpass QL query focusing strictly on commercial POIs & civic establishments
    const query = `
[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food|bar|pub|bank|pharmacy|clinic|hospital|school|college|kindergarten|cinema|theatre|library"]["name"](around:${radiusMeters},${lat},${lon});
  way["amenity"~"restaurant|cafe|fast_food|bar|pub|bank|pharmacy|clinic|hospital|school|college|kindergarten|cinema|theatre|library"]["name"](around:${radiusMeters},${lat},${lon});
  
  node["shop"]["name"](around:${radiusMeters},${lat},${lon});
  way["shop"]["name"](around:${radiusMeters},${lat},${lon});
  
  node["leisure"~"fitness_centre|gym|sports_centre|park"]["name"](around:${radiusMeters},${lat},${lon});
  way["leisure"~"fitness_centre|gym|sports_centre|park"]["name"](around:${radiusMeters},${lat},${lon});
  
  node["tourism"~"hotel|hostel|motel|museum"]["name"](around:${radiusMeters},${lat},${lon});
  way["tourism"~"hotel|hostel|motel|museum"]["name"](around:${radiusMeters},${lat},${lon});
  
  node["office"]["name"](around:${radiusMeters},${lat},${lon});
  way["office"]["name"](around:${radiusMeters},${lat},${lon});
);
out center body;
`;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API responded with status ${response.status}`);
      }

      const data = await response.json();
      const elements = data.elements || [];

      // Strict filter: Require valid name and valid category
      const normalizedPlaces: NormalizedPlace[] = elements
        .filter((el: any) => el.tags && (el.tags.name || el.tags['brand'] || el.tags['official_name']))
        .map((el: any) => this.normalizeOSMElement(el));

      return {
        sourceName: this.name,
        sourceType: this.sourceType,
        places: normalizedPlaces,
        rawCount: elements.length,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error("Failed to query Overpass API:", err);
      throw new Error(`Overpass data collection failed: ${err.message || 'Network error'}`);
    }
  }

  private normalizeOSMElement(el: any): NormalizedPlace {
    const tags = el.tags || {};
    const external_id = `${el.type}/${el.id}`;
    const name = tags.name || tags['brand'] || tags['official_name'] || 'Unnamed Place';

    const latitude = el.lat || (el.center ? el.center.lat : 0);
    const longitude = el.lon || (el.center ? el.center.lon : 0);

    let category = 'Business & Services';
    if (tags.amenity) {
      category = this.mapCategory(tags.amenity);
    } else if (tags.shop) {
      category = tags.shop === 'supermarket' ? 'Supermarket' : `Retail (${tags.shop.replace('_', ' ')})`;
    } else if (tags.leisure) {
      category = tags.leisure === 'fitness_centre' ? 'Gym & Fitness' : 'Recreation';
    } else if (tags.tourism) {
      category = 'Hotel & Tourism';
    } else if (tags.office) {
      category = 'Office';
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
      // Fallback cross-street / location reference
      formattedAddr = city && state ? `Located in ${city}, ${state}` : 'Street address pending map survey';
    }

    if (city && state && !formattedAddr.includes(city)) {
      formattedAddr += `, ${city}, ${state} ${zip}`.trim();
    }

    return {
      external_id,
      name,
      category,
      address: formattedAddr,
      latitude,
      longitude,
      metadata: {
        osm_type: el.type,
        osm_id: el.id,
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
