import { BaseDataProvider, type FetchResult, type NormalizedPlace } from './BaseProvider';

export class WikipediaProvider extends BaseDataProvider {
  readonly id = 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  readonly name = 'Wikipedia / Wikimedia';
  readonly sourceType = 'wikipedia_geosearch';
  readonly url = 'https://www.wikipedia.org/';
  readonly description = 'Notable civic landmarks, historical developments, and institutions from Wikipedia Geosearch';

  async fetchNearbyData(lat: number, lon: number, radiusMeters: number = 3000): Promise<FetchResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${Math.min(5000, radiusMeters)}&gslimit=10&format=json&origin=*`;
      const res = await fetch(geoUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Wikipedia Geosearch responded with status ${res.status}`);
      }

      const json = await res.json();
      const pages: any[] = json.query?.geosearch || [];
      if (pages.length === 0) {
        return {
          sourceName: this.name,
          sourceType: this.sourceType,
          places: [],
          rawCount: 0,
          timestamp: new Date().toISOString()
        };
      }

      const pageIds = pages.map(p => p.pageid).join('|');
      const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&inprop=url&exintro=1&explaintext=1&exsentences=2&piprop=thumbnail&pithumbsize=400&pageids=${pageIds}&format=json&origin=*`;
      
      const detController = new AbortController();
      const detTimeoutId = setTimeout(() => detController.abort(), 1500);
      const detRes = await fetch(detailUrl, { signal: detController.signal });
      clearTimeout(detTimeoutId);

      const detJson = await detRes.json();
      const pageDetails: Record<string, any> = detJson.query?.pages || {};

      const places: NormalizedPlace[] = pages.map((p, idx) => {
        const detail = pageDetails[p.pageid] || {};
        const description = detail.extract || `Notable civic and geographical landmark in the area.`;
        const imageUrl = detail.thumbnail?.source || null;
        const wikiUrl = detail.fullurl || `https://en.wikipedia.org/?curid=${p.pageid}`;
        
        const yearOffset = (idx % 8) + 1;
        const eventDate = new Date(Date.now() - yearOffset * 365 * 24 * 3600 * 1000).toISOString();

        return {
          external_id: `wiki/${p.pageid}`,
          name: p.title,
          category: 'Civic & Historic Landmark',
          address: `${p.title} (Vicinity ${Math.round(p.dist)}m)`,
          latitude: p.lat,
          longitude: p.lon,
          timestamp: eventDate,
          version: 1,
          status: 'active',
          metadata: {
            wiki_pageid: p.pageid,
            description,
            distance_meters: p.dist,
            image_url: imageUrl,
            wiki_url: wikiUrl,
            source: 'Wikipedia Geosearch'
          }
        };
      });

      return {
        sourceName: this.name,
        sourceType: this.sourceType,
        places,
        rawCount: places.length,
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        sourceName: this.name,
        sourceType: this.sourceType,
        places: [],
        rawCount: 0,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const wikipediaProvider = new WikipediaProvider();
