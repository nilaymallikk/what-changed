import { NextResponse } from 'next/server';

const CENSUS_API_KEY = 'c567ef8ae8fdb62ddd3425dc25ba6155234c575c';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ zip: string }> }
) {
  const { zip } = await params;
  const cleanZip = (zip || '').trim();

  if (!cleanZip || cleanZip.length !== 5) {
    return NextResponse.json({ error: 'Invalid ZIP' }, { status: 400 });
  }

  try {
    const censusUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E,B11001_001E,B19013_001E,B25001_001E,B01002_001E,B25077_001E&for=zip+code+tabulation+area:${cleanZip}&key=${CENSUS_API_KEY}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(censusUrl, {
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache for 24h
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json) && json.length >= 2) {
        const headers = json[0];
        const values = json[1];
        const getValue = (varName: string): number => {
          const index = headers.indexOf(varName);
          if (index === -1) return 0;
          const val = parseFloat(values[index]);
          return isNaN(val) || val < 0 ? 0 : val;
        };

        const population = getValue("B01003_001E");
        const median_income = getValue("B19013_001E");
        const housing_units = getValue("B25001_001E");
        const households = getValue("B11001_001E");
        const median_age = getValue("B01002_001E");
        const median_home_value = getValue("B25077_001E");

        return NextResponse.json({
          zip: cleanZip,
          zcta: cleanZip,
          population: population || 0,
          households: households || 0,
          median_income: median_income || 0,
          housing_units: housing_units || 0,
          median_age: median_age || 0,
          median_home_value: median_home_value || 0,
          source: `US Census Bureau ACS 5-Year (ZCTA ${cleanZip})`
        });
      }
    }
  } catch (err: any) {
    console.warn("API Census proxy error:", err.message);
  }

  return NextResponse.json({ error: 'Census record not available' }, { status: 404 });
}
