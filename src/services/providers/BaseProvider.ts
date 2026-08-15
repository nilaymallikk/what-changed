import type { NormalizedPlace } from '../../types';

export type { NormalizedPlace };

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

export abstract class BaseDataProvider implements IDataProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly sourceType: string;
  abstract readonly url: string;
  abstract readonly description: string;

  abstract fetchNearbyData(lat: number, lon: number, radiusMeters?: number): Promise<FetchResult>;
}
