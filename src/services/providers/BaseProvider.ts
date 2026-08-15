export interface NormalizedPlace {
  external_id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  metadata: Record<string, any>;
}

export interface FetchResult {
  sourceName: string;
  sourceType: string;
  places: NormalizedPlace[];
  rawCount: number;
  timestamp: string;
}

export interface IDataProvider {
  readonly id: string;
  readonly name: string;
  readonly sourceType: string;
  readonly url: string;
  readonly description: string;

  fetchNearbyData(lat: number, lon: number, radiusMeters?: number): Promise<FetchResult>;
}

// Extensible stubs for future data providers
export abstract class BaseDataProvider implements IDataProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly sourceType: string;
  abstract readonly url: string;
  abstract readonly description: string;

  abstract fetchNearbyData(lat: number, lon: number, radiusMeters?: number): Promise<FetchResult>;
}

/**
 * Future Architecture Providers (Prepared for expansion)
 */
export class ConstructionProvider extends BaseDataProvider {
  readonly id = 'construction_provider_stub';
  readonly name = 'Municipal Construction Permits';
  readonly sourceType = 'construction_permits';
  readonly url = 'https://data.gov';
  readonly description = 'Tracks local building and renovation permits (Future Integration)';

  async fetchNearbyData(_lat: number, _lon: number): Promise<FetchResult> {
    return {
      sourceName: this.name,
      sourceType: this.sourceType,
      places: [],
      rawCount: 0,
      timestamp: new Date().toISOString()
    };
  }
}

export class TransitProvider extends BaseDataProvider {
  readonly id = 'transit_provider_stub';
  readonly name = 'GTFS Public Transit';
  readonly sourceType = 'gtfs_transit';
  readonly url = 'https://transitfeeds.com';
  readonly description = 'Tracks bus and rail stop changes (Future Integration)';

  async fetchNearbyData(_lat: number, _lon: number): Promise<FetchResult> {
    return {
      sourceName: this.name,
      sourceType: this.sourceType,
      places: [],
      rawCount: 0,
      timestamp: new Date().toISOString()
    };
  }
}
