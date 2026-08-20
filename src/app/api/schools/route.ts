import { NextRequest, NextResponse } from 'next/server';
import type { EducationData, NearbySchool } from '@/types';

const NCES_QUERY = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_ADMINDATA_PUBLICSCH_2425/MapServer/1/query';

function numberParam(value: string | null, min: number, max: number): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resourceIndex(ratio: number | null, enrollment: number | null, distance: number) {
  const ratioPoints = ratio === null ? 25 : Math.max(10, Math.min(60, 60 - Math.max(0, ratio - 10) * 3.3));
  const enrollmentPoints = enrollment === null ? 10 : Math.max(6, Math.min(20, 6 + Math.log10(Math.max(10, enrollment)) * 5));
  const accessPoints = Math.max(5, 20 - distance * 2.5);
  return Math.round(Math.min(100, ratioPoints + enrollmentPoints + accessPoints));
}

export async function GET(request: NextRequest) {
  const lat = numberParam(request.nextUrl.searchParams.get('lat'), -90, 90);
  const lon = numberParam(request.nextUrl.searchParams.get('lon'), -180, 180);
  if (lat === null || lon === null) {
    return NextResponse.json({ error: 'Valid lat and lon are required.' }, { status: 400 });
  }

  const url = new URL(NCES_QUERY);
  url.searchParams.set('geometry', `${lon},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('distance', '10000');
  url.searchParams.set('units', 'esriSRUnit_Meter');
  url.searchParams.set('where', "SY_STATUS_TEXT='Open'");
  url.searchParams.set('outFields', 'NCESSCH,SCH_NAME,LEA_NAME,LSTREET1,LCITY,LSTATE,LZIP,SCHOOL_LEVEL,GSLO,GSHI,MEMBER,FTE,STUTERATIO,TOTFRL,CHARTER_TEXT,LATCOD,LONCOD,SURVYEAR');
  url.searchParams.set('returnGeometry', 'false');
  url.searchParams.set('resultRecordCount', '40');
  url.searchParams.set('f', 'json');

  try {
    const response = await fetch(url, { next: { revalidate: 604800 } });
    if (!response.ok) throw new Error(`NCES returned ${response.status}`);
    const payload = await response.json();
    if (payload.error) throw new Error(payload.error.message || 'NCES query failed');

    const schools: NearbySchool[] = (payload.features || []).map((feature: any) => {
      const row = feature.attributes || {};
      const schoolLat = Number(row.LATCOD);
      const schoolLon = Number(row.LONCOD);
      const enrollment = Number(row.MEMBER) > 0 ? Number(row.MEMBER) : null;
      const teachers = Number(row.FTE) > 0 ? Number(row.FTE) : null;
      const ratio = Number(row.STUTERATIO) > 0
        ? Number(row.STUTERATIO)
        : enrollment && teachers ? enrollment / teachers : null;
      const distance = distanceKm(lat, lon, schoolLat, schoolLon);
      const lunchCount = Number(row.TOTFRL);

      return {
        nces_id: String(row.NCESSCH),
        name: row.SCH_NAME || 'Public school',
        district: row.LEA_NAME || 'District not reported',
        address: row.LSTREET1 || '',
        city: row.LCITY || '',
        state: String(row.LSTATE || '').trim(),
        zip: String(row.LZIP || ''),
        level: row.SCHOOL_LEVEL || 'Other',
        grades: `${row.GSLO || '?'}–${row.GSHI || '?'}`,
        enrollment,
        teachers_fte: teachers ? Number(teachers.toFixed(1)) : null,
        student_teacher_ratio: ratio ? Number(ratio.toFixed(1)) : null,
        free_reduced_lunch_pct: enrollment && lunchCount >= 0
          ? Number(Math.min(100, lunchCount / enrollment * 100).toFixed(1))
          : null,
        charter: row.CHARTER_TEXT === 'Yes',
        latitude: schoolLat,
        longitude: schoolLon,
        distance_km: Number(distance.toFixed(2)),
        resource_index: resourceIndex(ratio, enrollment, distance)
      };
    }).filter((school: NearbySchool) => Number.isFinite(school.latitude) && Number.isFinite(school.longitude))
      .sort((a: NearbySchool, b: NearbySchool) => a.distance_km - b.distance_km);

    const ratios = schools.map((school) => school.student_teacher_ratio).filter((value): value is number => value !== null);
    const averageRatio = ratios.length ? ratios.reduce((sum, value) => sum + value, 0) / ratios.length : null;
    const densityPoints = Math.min(45, schools.filter((school) => school.distance_km <= 5).length * 4.5);
    const ratioPoints = averageRatio === null ? 25 : Math.max(10, Math.min(45, 45 - Math.max(0, averageRatio - 10) * 2.5));
    const accessIndex = Math.round(Math.min(100, densityPoints + ratioPoints + 10));

    const result: EducationData = {
      schools: schools.slice(0, 12),
      access_index: accessIndex,
      school_count: schools.length,
      average_student_teacher_ratio: averageRatio ? Number(averageRatio.toFixed(1)) : null,
      source: 'NCES EDGE Common Core of Data (public domain)',
      school_year: '2024–25',
      methodology: 'The access index combines nearby public-school count, proximity, and reported student/teacher ratios. It is not an academic rating and does not use neighborhood demographics as a quality proxy.'
    };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=1209600' }
    });
  } catch (error) {
    console.error('NCES route failed:', error);
    return NextResponse.json({ error: 'NCES school data is temporarily unavailable.' }, { status: 502 });
  }
}
