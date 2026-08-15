'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Search, ArrowRight, Activity, Building, Compass 
} from 'lucide-react';
import { isValidUSZip } from '@/services/geocoding';

interface MetroRegion {
  region: string;
  cities: {
    zip: string;
    city: string;
    state: string;
    neighborhood: string;
    highlights: string;
  }[];
}

const METRO_REGIONS: MetroRegion[] = [
  {
    region: 'Northeast Corridor',
    cities: [
      { zip: '10001', city: 'New York', state: 'NY', neighborhood: 'Chelsea / Hudson Yards', highlights: 'Retail openings, dining additions, High Line corridor updates' },
      { zip: '10003', city: 'New York', state: 'NY', neighborhood: 'East Village / Union Square', highlights: 'Cultural landmarks, bookshops, boutique dining shifts' },
      { zip: '02138', city: 'Cambridge', state: 'MA', neighborhood: 'Harvard Square', highlights: 'Academic institutions, biotech hubs, historic venues' },
      { zip: '19104', city: 'Philadelphia', state: 'PA', neighborhood: 'University City', highlights: 'Transit expansion, student hubs, research centers' }
    ]
  },
  {
    region: 'West Coast & Pacific',
    cities: [
      { zip: '90210', city: 'Beverly Hills', state: 'CA', neighborhood: 'Rodeo / Wilshire Corridor', highlights: 'Luxury retail, fine dining, civic garden developments' },
      { zip: '94102', city: 'San Francisco', state: 'CA', neighborhood: 'Civic Center / Hayes Valley', highlights: 'Arts pavilion, boutique dining, urban mobility shifts' },
      { zip: '98101', city: 'Seattle', state: 'WA', neighborhood: 'Downtown / Pike Place', highlights: 'Waterfront promenade additions, tech commercial updates' },
      { zip: '97209', city: 'Portland', state: 'OR', neighborhood: 'Pearl District', highlights: 'Art galleries, converted loft retail, artisanal cafes' }
    ]
  },
  {
    region: 'South & Sunbelt',
    cities: [
      { zip: '33139', city: 'Miami Beach', state: 'FL', neighborhood: 'South Beach / Ocean Drive', highlights: 'Beachfront lounges, hospitality rebranding, retail' },
      { zip: '77005', city: 'Houston', state: 'TX', neighborhood: 'Rice Village / West University', highlights: 'Boutique fitness, artisanal bakeries, medical centers' },
      { zip: '78701', city: 'Austin', state: 'TX', neighborhood: 'Downtown / 6th Street', highlights: 'Live music venues, tech corporate expansions, dining' },
      { zip: '30309', city: 'Atlanta', state: 'GA', neighborhood: 'Midtown Arts District', highlights: 'High-rise residential ground retail, cultural hubs' }
    ]
  },
  {
    region: 'Midwest & Great Lakes',
    cities: [
      { zip: '60611', city: 'Chicago', state: 'IL', neighborhood: 'Magnificent Mile / Streeterville', highlights: 'Hospitality venues, lakefront amenities, retail updates' },
      { zip: '55401', city: 'Minneapolis', state: 'MN', neighborhood: 'North Loop', highlights: 'Historic warehouse district dining, craft breweries' },
      { zip: '48226', city: 'Detroit', state: 'MI', neighborhood: 'Downtown / Campus Martius', highlights: 'Urban revitalization, startup offices, creative venues' }
    ]
  }
];

export default function ExplorePage() {
  const [zipInput, setZipInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = zipInput.trim();
    if (isValidUSZip(clean)) {
      router.push(`/area/${clean}`);
    }
  };

  const filteredRegions = METRO_REGIONS.map(reg => ({
    ...reg,
    cities: reg.cities.filter(c => 
      c.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.state.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.zip.includes(searchFilter) ||
      c.neighborhood.toLowerCase().includes(searchFilter.toLowerCase())
    )
  })).filter(reg => reg.cities.length > 0);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      
      {/* Top Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
            <Compass className="w-3.5 h-3.5 text-white" />
            <span>National Intelligence Directory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
            Explore US Metro Areas
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto font-mono">
            Browse active spatial intelligence across key American commercial corridors and neighborhoods
          </p>

          {/* Quick ZIP Search */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Jump to any 5-digit ZIP..."
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                maxLength={5}
                className="w-full bg-zinc-900 text-white placeholder-zinc-500 text-xs font-mono pl-9 pr-4 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-white"
              />
            </div>
            <button
              type="submit"
              className="btn-interactive px-4 py-2.5 bg-white text-black font-extrabold text-xs uppercase rounded-lg shrink-0 cursor-pointer"
            >
              Go
            </button>
          </form>

        </div>
      </div>

      {/* Directory Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Search / Filter Filter */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 font-mono text-xs">
          <span className="text-zinc-500 font-bold uppercase tracking-wider">
            Regions & Districts ({filteredRegions.reduce((acc, r) => acc + r.cities.length, 0)} Total Areas)
          </span>
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by city, state or ZIP..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-zinc-950 text-white placeholder-zinc-600 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Regions Grid */}
        <div className="space-y-10">
          {filteredRegions.map((regionGroup, idx) => (
            <div key={idx} className="space-y-4">
              
              <h2 className="text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-zinc-900 pb-2">
                <Building className="w-4 h-4 text-zinc-500" />
                <span>{regionGroup.region}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                {regionGroup.cities.map((city) => (
                  <Link
                    key={city.zip}
                    href={`/area/${city.zip}`}
                    className="btn-interactive mono-card mono-card-hover p-5 rounded-xl border border-zinc-800/80 hover:border-zinc-500 flex flex-col justify-between space-y-3 cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-white font-bold text-xs">
                          ZIP {city.zip}
                        </span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-400" />
                          <span>Live Scan Ready</span>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white font-sans mt-2.5 group-hover:text-zinc-200">
                        {city.city}, {city.state}
                      </h3>
                      <span className="text-xs text-zinc-400 block mt-0.5">
                        {city.neighborhood}
                      </span>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed font-sans font-normal">
                        {city.highlights}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-400">
                      <span>Explore Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-10 text-xs text-zinc-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>
            Built by{' '}
            <a
              href="https://x.com/nilaymallikX"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white font-bold underline decoration-zinc-700 underline-offset-2 transition-colors"
            >
              Nilay Mallik
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-5 text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/data-sources" className="hover:text-white transition-colors">Data Sources</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
