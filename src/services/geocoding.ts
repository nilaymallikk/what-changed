import type { GeoLocation } from '../types';


export function isValidUSZip(zip: string): boolean {
  const cleanZip = zip.trim();
  return /^\d{5}(-\d{4})?$/.test(cleanZip);
}

// Known fallback coordinates for major US ZIPs to ensure 100% instant reliability
const KNOWN_ZIPS: Record<string, GeoLocation> = {
  '90210': { zip: '90210', city: 'Beverly Hills', state: 'CA', latitude: 34.0736, longitude: -118.4004 },
  '10001': { zip: '10001', city: 'New York', state: 'NY', latitude: 40.7501, longitude: -73.9996 },
  '94103': { zip: '94103', city: 'San Francisco', state: 'CA', latitude: 37.7726, longitude: -122.4099 },
  '60601': { zip: '60601', city: 'Chicago', state: 'IL', latitude: 41.8858, longitude: -87.6229 },
  '33139': { zip: '33139', city: 'Miami Beach', state: 'FL', latitude: 25.7826, longitude: -80.1340 },
  '78701': { zip: '78701', city: 'Austin', state: 'TX', latitude: 30.2711, longitude: -97.7437 },
  '98101': { zip: '98101', city: 'Seattle', state: 'WA', latitude: 47.6101, longitude: -122.3344 },
  '02138': { zip: '02138', city: 'Cambridge', state: 'MA', latitude: 42.3784, longitude: -71.1172 }
};

export interface IGeocodingProvider {
  resolveZip(zip: string): Promise<GeoLocation>;
}

export class PublicGeocodingProvider implements IGeocodingProvider {
  async resolveZip(zipInput: string): Promise<GeoLocation> {
    const zip = zipInput.trim().slice(0, 5);
    
    if (!isValidUSZip(zipInput)) {
      throw new Error("Invalid US ZIP code format. Please enter a 5-digit US ZIP code.");
    }

    // Check fast static fallback first
    if (KNOWN_ZIPS[zip]) {
      return KNOWN_ZIPS[zip];
    }

    // Try Primary API 1: Zippopotam.us
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (res.ok) {
        const data = await res.json();
        const place = data.places?.[0];
        if (place) {
          return {
            zip: data['post code'] || zip,
            city: place['place name'] || 'Unknown City',
            state: place['state abbreviation'] || place.state || 'US',
            latitude: parseFloat(place.latitude),
            longitude: parseFloat(place.longitude)
          };
        }
      }
    } catch (e) {
      console.warn("Zippopotam lookup failed, trying Nominatim fallback:", e);
    }

    // Secondary API: OpenStreetMap Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1`, {
        headers: { 'User-Agent': 'WhatChangedAroundMe/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const displayParts = (item.display_name || '').split(',');
          const city = displayParts[0]?.trim() || 'Unknown City';
          const state = displayParts[1]?.trim().slice(0, 2).toUpperCase() || 'US';
          return {
            zip,
            city,
            state,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
          };
        }
      }
    } catch (e) {
      console.warn("Nominatim lookup failed:", e);
    }

    throw new Error(`Couldn't find location for ZIP code ${zip}. Please verify and try again.`);
  }
}

export const defaultGeocodingProvider = new PublicGeocodingProvider();
