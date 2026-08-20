import { NextRequest, NextResponse } from 'next/server';
import type { StreetViewCapture, StreetViewData } from '@/types';

function numberParam(value: string | null, min: number, max: number): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function capture(row: any): StreetViewCapture | null {
  const imageUrl = row.imageProcUrl || row.fileurlProc;
  const capturedAt = row.shotDate || row.dateAdded;
  const latitude = Number(row.lat);
  const longitude = Number(row.lng);
  if (!imageUrl || !capturedAt || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    id: String(row.id),
    image_url: imageUrl,
    captured_at: String(capturedAt).replace(' ', 'T').replace(/\.000$/, 'Z'),
    latitude,
    longitude,
    heading: Number.isFinite(Number(row.heading)) ? Number(row.heading) : null,
    distance_m: Number.isFinite(Number(row.distance)) ? Number(row.distance) : null,
    sequence_id: row.sequence?.id ? String(row.sequence.id) : null,
    source_url: `https://kartaview.org/details/${row.sequence?.id || ''}/${row.id}`
  };
}

function headingDifference(a: number | null, b: number | null) {
  if (a === null || b === null) return 0;
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function choosePair(captures: StreetViewCapture[]) {
  if (!captures.length) return { before: null, after: null };
  const sorted = [...captures].sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
  const after = sorted.at(-1)!;
  const before = sorted.find((candidate) =>
    candidate.id !== after.id
    && Math.abs(new Date(after.captured_at).getTime() - new Date(candidate.captured_at).getTime()) >= 180 * 86400000
    && (candidate.distance_m === null || after.distance_m === null || Math.abs(candidate.distance_m - after.distance_m) <= 180)
    && headingDifference(candidate.heading, after.heading) <= 65
  ) || sorted.find((candidate) => candidate.id !== after.id) || null;
  return { before, after };
}

export async function GET(request: NextRequest) {
  const lat = numberParam(request.nextUrl.searchParams.get('lat'), -90, 90);
  const lon = numberParam(request.nextUrl.searchParams.get('lon'), -180, 180);
  if (lat === null || lon === null) {
    return NextResponse.json({ error: 'Valid lat and lon are required.' }, { status: 400 });
  }

  const fetchNearby = async (searchLat: number, searchLon: number) => {
    const url = new URL('https://api.openstreetcam.org/2.0/photo/');
    url.searchParams.set('lat', String(searchLat));
    url.searchParams.set('lng', String(searchLon));
    url.searchParams.set('zoomLevel', '15');
    url.searchParams.set('join', 'sequence');
    url.searchParams.set('orderBy', 'id');
    url.searchParams.set('orderDirection', 'desc');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' }
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) return [];
    const payload = await response.json();
    return payload?.result?.data || [];
  };

  try {
    let rows = await fetchNearby(lat, lon);
    if (!rows.length) {
      const nearbyRows = await Promise.all([
        fetchNearby(lat + 0.0012, lon),
        fetchNearby(lat - 0.0012, lon),
        fetchNearby(lat, lon + 0.0016),
        fetchNearby(lat, lon - 0.0016)
      ]);
      rows = nearbyRows.flat();
    }
    const uniqueRows = [...new Map(rows.map((row: any) => [String(row.id), row])).values()];
    const captures = uniqueRows
      .map(capture)
      .filter((item: StreetViewCapture | null): item is StreetViewCapture => item !== null)
      .filter((item: StreetViewCapture) => item.distance_m === null || item.distance_m <= 1000);
    const pair = choosePair(captures);
    const result: StreetViewData = {
      ...pair,
      captures_found: captures.length,
      source: 'KartaView open street-level imagery',
      coverage: pair.before && pair.after
        ? 'Showing the closest compatible dated captures returned near the ZIP centroid.'
        : pair.after
          ? 'Only one usable nearby capture was returned, so a historical comparison is unavailable.'
          : 'No public street-level imagery was returned near the ZIP centroid.',
      methodology: 'Captures are crowdsourced. Before/after images may differ in camera position, heading, lighting, or season and should not be treated as proof of a physical change.'
    };
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }
    });
  } catch (error) {
    console.error('Street imagery route failed:', error);
    const unavailable: StreetViewData = {
      before: null,
      after: null,
      captures_found: 0,
      source: 'KartaView open street-level imagery',
      coverage: 'The free imagery service did not respond or has no coverage for this location.',
      methodology: 'No substitute or synthetic imagery is displayed when coverage is unavailable.'
    };
    return NextResponse.json(unavailable, { status: 200 });
  }
}
