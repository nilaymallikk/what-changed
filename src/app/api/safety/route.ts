import { NextRequest, NextResponse } from 'next/server';
import type { SafetyData, SafetyIncident, SafetyTrendPoint } from '@/types';

const FBI_BASE = 'https://cde.ucr.cjis.gov/LATEST/summarized/state';

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia'
};

function numberParam(value: string | null, min: number, max: number): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (/cityofchicago|cityofnewyork|lacity/.test(url) && process.env.SOCRATA_APP_TOKEN) {
      headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;
    }
    const response = await fetch(url, {
      signal: controller.signal,
      headers,
      next: { revalidate: 21600 }
    });
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function yearlyRates(payload: any, stateName: string): SafetyTrendPoint[] {
  const rates = payload?.offenses?.rates || {};
  const stateRates = rates[`${stateName} Offenses`] || {};
  const nationalRates = rates['United States Offenses'] || {};
  const years = new Set<number>();

  for (const key of [...Object.keys(stateRates), ...Object.keys(nationalRates)]) {
    const year = Number(key.split('-')[1]);
    if (Number.isFinite(year)) years.add(year);
  }

  return [...years].sort().map((year) => {
    const stateValues = Object.entries(stateRates)
      .filter(([key]) => key.endsWith(`-${year}`))
      .map(([, value]) => Number(value))
      .filter(Number.isFinite);
    const nationalValues = Object.entries(nationalRates)
      .filter(([key]) => key.endsWith(`-${year}`))
      .map(([, value]) => Number(value))
      .filter(Number.isFinite);
    const average = (values: number[]) => values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

    return {
      year,
      state_rate: Number(average(stateValues).toFixed(2)),
      national_rate: Number(average(nationalValues).toFixed(2))
    };
  }).filter((point) => point.state_rate > 0 && point.national_rate > 0);
}

function severityFor(category: string): number {
  const value = category.toLowerCase();
  if (/homicide|murder|sexual|rape|assault|robbery|weapon/.test(value)) return 1;
  if (/burglary|theft|vehicle|arson/.test(value)) return 0.68;
  return 0.42;
}

function bbox(lat: number, lon: number) {
  return {
    south: Number((lat - 0.055).toFixed(6)),
    north: Number((lat + 0.055).toFixed(6)),
    west: Number((lon - 0.075).toFixed(6)),
    east: Number((lon + 0.075).toFixed(6))
  };
}

async function fetchChicago(lat: number, lon: number): Promise<SafetyIncident[]> {
  const box = bbox(lat, lon);
  const since = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const url = new URL('https://data.cityofchicago.org/resource/ijzp-q8t2.json');
  url.searchParams.set('$select', 'id,case_number,date,block,primary_type,description,latitude,longitude');
  url.searchParams.set('$where', `latitude between ${box.south} and ${box.north} AND longitude between ${box.west} and ${box.east} AND date >= '${since}T00:00:00'`);
  url.searchParams.set('$order', 'date DESC');
  url.searchParams.set('$limit', '300');
  const rows = await fetchJson(url.toString());
  return rows.map((row: any): SafetyIncident => ({
    id: String(row.id || row.case_number),
    category: row.primary_type || 'Reported incident',
    description: row.description || '',
    occurred_at: row.date,
    address: row.block || 'Block location withheld',
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    severity: severityFor(row.primary_type || ''),
    source_url: `https://data.cityofchicago.org/resource/ijzp-q8t2`
  })).filter((row: SafetyIncident) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
}

async function fetchNewYork(lat: number, lon: number): Promise<SafetyIncident[]> {
  const box = bbox(lat, lon);
  const since = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const url = new URL('https://data.cityofnewyork.us/resource/5uac-w243.json');
  url.searchParams.set('$select', 'cmplnt_num,cmplnt_fr_dt,ofns_desc,pd_desc,law_cat_cd,latitude,longitude,boro_nm');
  url.searchParams.set('$where', `latitude between ${box.south} and ${box.north} AND longitude between ${box.west} and ${box.east} AND cmplnt_fr_dt >= '${since}T00:00:00'`);
  url.searchParams.set('$order', 'cmplnt_fr_dt DESC');
  url.searchParams.set('$limit', '300');
  const rows = await fetchJson(url.toString());
  return rows.map((row: any): SafetyIncident => ({
    id: String(row.cmplnt_num),
    category: row.ofns_desc || 'Reported complaint',
    description: [row.pd_desc, row.law_cat_cd].filter(Boolean).join(' · '),
    occurred_at: row.cmplnt_fr_dt,
    address: row.boro_nm ? `${row.boro_nm} — location generalized by NYPD` : 'Location generalized by NYPD',
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    severity: severityFor(`${row.ofns_desc || ''} ${row.law_cat_cd || ''}`),
    source_url: 'https://data.cityofnewyork.us/resource/5uac-w243'
  })).filter((row: SafetyIncident) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
}

async function fetchLosAngeles(lat: number, lon: number): Promise<SafetyIncident[]> {
  const box = bbox(lat, lon);
  const since = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const url = new URL('https://data.lacity.org/resource/2nrs-mtv8.json');
  url.searchParams.set('$select', 'dr_no,date_occ,crm_cd_desc,premis_desc,status_desc,location,lat,lon');
  url.searchParams.set('$where', `lat between ${box.south} and ${box.north} AND lon between ${box.west} and ${box.east} AND date_occ >= '${since}T00:00:00'`);
  url.searchParams.set('$order', 'date_occ DESC');
  url.searchParams.set('$limit', '300');
  const rows = await fetchJson(url.toString());
  return rows.map((row: any): SafetyIncident => ({
    id: String(row.dr_no),
    category: row.crm_cd_desc || 'Reported incident',
    description: [row.premis_desc, row.status_desc].filter(Boolean).join(' · '),
    occurred_at: row.date_occ,
    address: row.location || 'Location generalized by LAPD',
    latitude: Number(row.lat),
    longitude: Number(row.lon),
    severity: severityFor(row.crm_cd_desc || ''),
    source_url: 'https://data.lacity.org/resource/2nrs-mtv8'
  })).filter((row: SafetyIncident) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
}

async function municipalIncidents(city: string, lat: number, lon: number) {
  const normalized = city.toLowerCase();
  if (/chicago/.test(normalized)) return { incidents: await fetchChicago(lat, lon), source: 'Chicago Police Department Open Data' };
  if (/new york|brooklyn|flushing/.test(normalized)) return { incidents: await fetchNewYork(lat, lon), source: 'NYPD Complaint Data Current YTD' };
  if (/los angeles/.test(normalized)) return { incidents: await fetchLosAngeles(lat, lon), source: 'Los Angeles Police Department Open Data' };
  return { incidents: [], source: null };
}

export async function GET(request: NextRequest) {
  const lat = numberParam(request.nextUrl.searchParams.get('lat'), -90, 90);
  const lon = numberParam(request.nextUrl.searchParams.get('lon'), -180, 180);
  const state = (request.nextUrl.searchParams.get('state') || '').trim().toUpperCase();
  const city = (request.nextUrl.searchParams.get('city') || '').trim().slice(0, 100);

  if (lat === null || lon === null || !STATE_NAMES[state] || !city) {
    return NextResponse.json({ error: 'Valid lat, lon, city, and two-letter state are required.' }, { status: 400 });
  }

  const currentYear = new Date().getUTCFullYear();
  const fromYear = currentYear - 3;
  const toYear = currentYear - 1;
  const trendUrl = (offense: string, from = fromYear, to = toYear) =>
    `${FBI_BASE}/${state}/${offense}?from=01-${from}&to=12-${to}&type=totals`;

  try {
    let [violentPayload, propertyPayload, municipal] = await Promise.all([
      fetchJson(trendUrl('violent-crime')),
      fetchJson(trendUrl('property-crime')),
      municipalIncidents(city, lat, lon).catch(() => ({ incidents: [], source: null }))
    ]);

    let violentCrime = yearlyRates(violentPayload, STATE_NAMES[state]);
    let propertyCrime = yearlyRates(propertyPayload, STATE_NAMES[state]);
    if (!violentCrime.length || !propertyCrime.length) {
      [violentPayload, propertyPayload] = await Promise.all([
        fetchJson(trendUrl('violent-crime', 2023, 2024)),
        fetchJson(trendUrl('property-crime', 2023, 2024))
      ]);
      violentCrime = yearlyRates(violentPayload, STATE_NAMES[state]);
      propertyCrime = yearlyRates(propertyPayload, STATE_NAMES[state]);
    }

    const sharedYears = violentCrime
      .map((point) => point.year)
      .filter((year) => propertyCrime.some((point) => point.year === year))
      .sort();
    const latestYear = sharedYears.at(-1) ?? null;
    const previousYear = sharedYears.at(-2) ?? null;
    const combined = (year: number, kind: 'state_rate' | 'national_rate') => {
      const violent = violentCrime.find((point) => point.year === year)?.[kind] || 0;
      const property = propertyCrime.find((point) => point.year === year)?.[kind] || 0;
      return violent + property;
    };
    const latestState = latestYear ? combined(latestYear, 'state_rate') : 0;
    const latestNational = latestYear ? combined(latestYear, 'national_rate') : 0;
    const previousState = previousYear ? combined(previousYear, 'state_rate') : 0;

    const result: SafetyData = {
      incidents: municipal.incidents,
      incident_source: municipal.source,
      incident_coverage: municipal.source
        ? `Mapped reports from the latest available municipal feed within approximately 5 km; ${municipal.incidents.length} records returned.`
        : 'No normalized municipal incident feed is configured for this city. The panel shows state-level FBI context only.',
      violent_crime: violentCrime,
      property_crime: propertyCrime,
      latest_year: latestYear,
      state_vs_national_pct: latestNational > 0 ? Number((((latestState / latestNational) - 1) * 100).toFixed(1)) : null,
      year_over_year_pct: previousState > 0 ? Number((((latestState / previousState) - 1) * 100).toFixed(1)) : null,
      source: 'FBI Crime Data Explorer and official municipal open-data portals',
      methodology: 'FBI values are monthly reported-offense rates averaged within each year. Heat points are reported incidents, not convictions, and do not predict individual risk.'
    };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' }
    });
  } catch (error) {
    console.error('Safety data route failed:', error);
    return NextResponse.json({ error: 'Safety data is temporarily unavailable.' }, { status: 502 });
  }
}
