'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, ArrowLeftRight, Compass
} from 'lucide-react';
import { isValidUSZip } from '@/services/geocoding';

const POPULAR_COMPARISONS = [
  {
    slug: '10001-vs-90210',
    title: 'New York, NY vs Beverly Hills, CA',
    zipA: '10001',
    zipB: '90210',
    tag: 'Coast to Coast Hubs',
    sub: 'Chelsea / High Line vs Rodeo Drive / Golden Triangle'
  },
  {
    slug: '78701-vs-33139',
    title: 'Austin, TX vs Miami Beach, FL',
    zipA: '78701',
    zipB: '33139',
    tag: 'Sunbelt Expansion',
    sub: 'Downtown Austin vs South Beach Commercial District'
  },
  {
    slug: '60611-vs-98101',
    title: 'Chicago, IL vs Seattle, WA',
    zipA: '60611',
    zipB: '98101',
    tag: 'Urban Metros',
    sub: 'Magnificent Mile vs Downtown / Pike Place'
  },
  {
    slug: '94102-vs-77005',
    title: 'San Francisco, CA vs Houston, TX',
    zipA: '94102',
    zipB: '77005',
    tag: 'Commercial Shifts',
    sub: 'Civic Center / Hayes vs Rice Village / West U'
  },
  {
    slug: '02138-vs-30309',
    title: 'Cambridge, MA vs Atlanta, GA',
    zipA: '02138',
    zipB: '30309',
    tag: 'Innovation Corridors',
    sub: 'Harvard Square vs Midtown Arts District'
  },
  {
    slug: '10003-vs-19104',
    title: 'New York (East Village) vs Philadelphia, PA',
    zipA: '10003',
    zipB: '19104',
    tag: 'Northeast Historic',
    sub: 'Union Square vs University City'
  }
];

export default function CompareLandingPage() {
  const [zipA, setZipA] = useState('10001');
  const [zipB, setZipB] = useState('90210');
  const router = useRouter();

  const handleCustomCompare = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanA = zipA.trim();
    const cleanB = zipB.trim();
    if (isValidUSZip(cleanA) && isValidUSZip(cleanB)) {
      router.push(`/compare/${cleanA}-vs-${cleanB}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      
      {/* Hero Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
            <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
            <span>Dual Spatial Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
            Compare Neighborhoods Side-by-Side
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto font-mono">
            Compare commercial opening velocities, 10-year Census shifts, and economic Vitality Scores between any two US ZIP codes.
          </p>

          {/* Dual ZIP Input Form */}
          <form onSubmit={handleCustomCompare} className="max-w-xl mx-auto pt-4">
            <div className="mono-card p-3 rounded-2xl border border-zinc-700 bg-zinc-950 flex flex-col sm:flex-row items-center gap-3 shadow-2xl">
              
              <div className="flex-1 w-full">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase block text-left mb-1 pl-1">
                  Area A (ZIP Code)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10001"
                  value={zipA}
                  onChange={(e) => setZipA(e.target.value)}
                  maxLength={5}
                  className="w-full bg-zinc-900 text-white font-mono text-sm px-3.5 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-white"
                />
              </div>

              <div className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0 hidden sm:block">
                <ArrowLeftRight className="w-4 h-4" />
              </div>

              <div className="flex-1 w-full">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase block text-left mb-1 pl-1">
                  Area B (ZIP Code)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 90210"
                  value={zipB}
                  onChange={(e) => setZipB(e.target.value)}
                  maxLength={5}
                  className="w-full bg-zinc-900 text-white font-mono text-sm px-3.5 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-white"
                />
              </div>

              <div className="w-full sm:w-auto self-end pt-2 sm:pt-0">
                <button
                  type="submit"
                  className="btn-interactive w-full sm:w-auto px-6 py-3 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Compare</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </form>

        </div>
      </div>

      {/* Curated Pairings Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-mono text-xs">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-zinc-400" />
            <span>Popular National Comparisons</span>
          </h2>
          <span className="text-zinc-500">Live Dual Resolvers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POPULAR_COMPARISONS.map((comp) => (
            <Link
              key={comp.slug}
              href={`/compare/${comp.slug}`}
              className="btn-interactive mono-card mono-card-hover p-5 rounded-xl border border-zinc-800/90 hover:border-zinc-500 flex flex-col justify-between space-y-3 cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-white">
                      ZIP {comp.zipA}
                    </span>
                    <span className="text-zinc-500">VS</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-white">
                      ZIP {comp.zipB}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase">{comp.tag}</span>
                </div>

                <h3 className="text-base font-bold text-white font-sans mt-3 group-hover:text-zinc-200">
                  {comp.title}
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">
                  {comp.sub}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-zinc-400">
                <span>View Head-to-Head</span>
                <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-10 text-xs text-zinc-500 font-mono">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
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
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
