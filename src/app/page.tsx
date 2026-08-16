'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MapPin, ArrowRight, ArrowLeftRight, Compass, Utensils, ShoppingBag, 
  Landmark, Activity, ChevronDown 
} from 'lucide-react';
import { isValidUSZip } from '../services/geocoding';

interface PreviewItem {
  id: string;
  name: string;
  category: string;
  type: 'business_opened' | 'business_removed' | 'business_modified';
  address: string;
  timeAgo: string;
  confidence: number;
  sigScore: number;
  x: number; // Percentage coordinate for radar preview
  y: number;
}

const PREVIEW_CATEGORIES = {
  all: { label: 'All Activity', icon: Activity },
  food: { label: 'Dining & Cafes', icon: Utensils },
  retail: { label: 'Retail & Fashion', icon: ShoppingBag },
  civic: { label: 'Civic & Landmarks', icon: Landmark }
};

const SIMULATOR_DATA: Record<string, PreviewItem[]> = {
  all: [
    { id: 'sim_1', name: 'Blue Bottle Espresso Bar', category: 'Specialty Coffee', type: 'business_opened', address: '280 W 25th St', timeAgo: '2h ago', confidence: 98, sigScore: 84, x: 62, y: 38 },
    { id: 'sim_2', name: 'Westside Artisan Bakery', category: 'Bakery & Cafe', type: 'business_opened', address: '142 8th Ave', timeAgo: '6h ago', confidence: 96, sigScore: 78, x: 40, y: 55 },
    { id: 'sim_3', name: 'Highline Apothecary & Wellness', category: 'Pharmacy / Health', type: 'business_modified', address: '504 W 23rd St', timeAgo: '1d ago', confidence: 94, sigScore: 72, x: 70, y: 68 },
    { id: 'sim_4', name: 'Hudson Yard Dry Cleaners', category: 'Local Services', type: 'business_removed', address: '310 10th Ave', timeAgo: '3d ago', confidence: 91, sigScore: 65, x: 30, y: 30 },
    { id: 'sim_5', name: 'Empire Fitness & Boxing', category: 'Gym & Sports', type: 'business_opened', address: '118 W 27th St', timeAgo: '4d ago', confidence: 95, sigScore: 81, x: 50, y: 22 }
  ],
  food: [
    { id: 'sim_1', name: 'Blue Bottle Espresso Bar', category: 'Specialty Coffee', type: 'business_opened', address: '280 W 25th St', timeAgo: '2h ago', confidence: 98, sigScore: 84, x: 62, y: 38 },
    { id: 'sim_2', name: 'Westside Artisan Bakery', category: 'Bakery & Cafe', type: 'business_opened', address: '142 8th Ave', timeAgo: '6h ago', confidence: 96, sigScore: 78, x: 40, y: 55 }
  ],
  retail: [
    { id: 'sim_3', name: 'Highline Apothecary & Wellness', category: 'Pharmacy / Health', type: 'business_modified', address: '504 W 23rd St', timeAgo: '1d ago', confidence: 94, sigScore: 72, x: 70, y: 68 },
    { id: 'sim_4', name: 'Hudson Yard Dry Cleaners', category: 'Local Services', type: 'business_removed', address: '310 10th Ave', timeAgo: '3d ago', confidence: 91, sigScore: 65, x: 30, y: 30 }
  ],
  civic: [
    { id: 'sim_5', name: 'Chelsea Community Botanical Garden', category: 'Public Park / Garden', type: 'business_opened', address: '24th St & 10th Ave', timeAgo: '5d ago', confidence: 99, sigScore: 92, x: 75, y: 45 }
  ]
};

const FEATURED_METROS = [
  { zip: '10001', city: 'New York', state: 'NY', neighborhood: 'Chelsea / Hudson Yards', tag: 'High Velocity' },
  { zip: '90210', city: 'Beverly Hills', state: 'CA', neighborhood: 'Rodeo / Wilshire Corridor', tag: 'Commercial Core' },
  { zip: '33139', city: 'Miami Beach', state: 'FL', neighborhood: 'South Beach District', tag: 'Hospitality Shifts' },
  { zip: '77005', city: 'Houston', state: 'TX', neighborhood: 'Rice Village / West U', tag: 'Retail Expansion' },
  { zip: '60611', city: 'Chicago', state: 'IL', neighborhood: 'Magnificent Mile', tag: 'Urban Mixed' },
  { zip: '94102', city: 'San Francisco', state: 'CA', neighborhood: 'Civic Center / Hayes', tag: 'Boutique Dining' }
];

const FAQS = [
  {
    q: 'How does What Changed Around Me detect physical changes?',
    a: 'We query live spatial geographic engines and Wikipedia geosearch databases with revision histories, comparing previous snapshot states against current captures to detect new physical openings, renovations, closures, and unlisted entities.'
  },
  {
    q: 'Are the demographic figures real and accurate?',
    a: 'Yes. All demographic calculations (population, median household income, housing units, median home values) are pulled from official US Census Bureau American Community Survey (ACS) 5-Year datasets aggregated at the ZCTA level.'
  },
  {
    q: 'Is What Changed Around Me free to use?',
    a: 'Yes. The entire platform is 100% free and open-access, requiring no credit card, no account creation, and no paid subscriptions.'
  },
  {
    q: 'Can I search any 5-digit ZIP code in the United States?',
    a: 'Yes. We support all 41,000+ US ZIP codes across all 50 states and territories, automatically resolving the geographic perimeter, local businesses, and census tabulation areas.'
  }
];

export default function Homepage() {
  const [zipInput, setZipInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compareZipA, setCompareZipA] = useState('10001');
  const [compareZipB, setCompareZipB] = useState('90210');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedBlipId, setSelectedBlipId] = useState<string>('sim_1');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipInput.trim();
    if (isValidUSZip(cleanZip)) {
      setIsSubmitting(true);
      router.push(`/area/${cleanZip}`);
    }
  };

  const handleCompareSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanA = compareZipA.trim();
    const cleanB = compareZipB.trim();
    if (isValidUSZip(cleanA) && isValidUSZip(cleanB)) {
      router.push(`/compare/${cleanA}-vs-${cleanB}`);
    }
  };

  const currentItems = SIMULATOR_DATA[activeCategory] || SIMULATOR_DATA.all;
  const activeBlip = currentItems.find(item => item.id === selectedBlipId) || currentItems[0];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-14 sm:pt-24 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-800/80">
        
        {/* Subtle Background Glow Accent */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="w-[600px] h-[350px] bg-zinc-800/20 rounded-full blur-[120px] animate-pulse-glow" />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-7 relative z-10">
          
          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase text-white font-sans leading-[1.05]">
            WHAT CHANGED <br />
            <span className="shimmer-text">AROUND ME?</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-mono font-normal leading-relaxed">
            Instant open-access spatial intelligence. Discover new store openings, unlisted businesses, physical renovations, and 10-year Census shifts across any American ZIP code.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="mono-card p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2 border border-zinc-700 shadow-2xl focus-within:border-white transition-all bg-zinc-950">
              <div className="relative flex-1 w-full">
                <MapPin className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter 5-digit US ZIP (e.g. 10001, 90210)..."
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  maxLength={5}
                  className="w-full bg-transparent text-white placeholder-zinc-500 font-mono text-sm sm:text-base pl-12 pr-4 py-3 focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-interactive w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-75"
              >
                <span>{isSubmitting ? 'Scanning...' : 'Run Live Scan'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </form>

          {/* Quick Metro Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono">
            <span className="text-zinc-500 flex items-center gap-1 mr-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Trending Metros:</span>
            </span>
            {FEATURED_METROS.map((metro) => (
              <button
                key={metro.zip}
                onClick={() => router.push(`/area/${metro.zip}`)}
                className="btn-interactive px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                {metro.city} ({metro.zip})
              </button>
            ))}
          </div>

          {/* DUAL AREA COMPARISON QUICK BAR */}
          <div className="pt-6 border-t border-zinc-900/90 max-w-xl mx-auto space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-400" />
                <span>Compare Two Neighborhoods</span>
              </span>
              <Link href="/compare" className="text-zinc-500 hover:text-white text-[11px] underline transition-colors">
                View All Pairs →
              </Link>
            </div>

            <form onSubmit={handleCompareSearch} className="mono-card p-2 rounded-xl border border-zinc-800 bg-zinc-950/90 flex flex-col sm:flex-row items-center gap-2 shadow-xl">
              <div className="flex items-center gap-2 w-full flex-1">
                <input
                  type="text"
                  placeholder="ZIP A (e.g. 10001)"
                  value={compareZipA}
                  onChange={(e) => setCompareZipA(e.target.value)}
                  maxLength={5}
                  className="w-full bg-zinc-900 text-white font-mono text-xs px-3 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-white text-center"
                />
                <span className="text-zinc-500 text-xs font-bold">vs</span>
                <input
                  type="text"
                  placeholder="ZIP B (e.g. 90210)"
                  value={compareZipB}
                  onChange={(e) => setCompareZipB(e.target.value)}
                  maxLength={5}
                  className="w-full bg-zinc-900 text-white font-mono text-xs px-3 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-white text-center"
                />
              </div>
              <button
                type="submit"
                className="btn-interactive w-full sm:w-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Compare</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* METRIC COUNTER TICKER */}
      <section className="border-b border-zinc-800 bg-zinc-950 py-5 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono">
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-black text-white">41,000+</p>
            <p className="text-[11px] text-zinc-400 uppercase">US ZIP Codes Covered</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-black text-white">100% Free</p>
            <p className="text-[11px] text-zinc-400 uppercase">Open Public Access</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-black text-white">10-Year</p>
            <p className="text-[11px] text-zinc-400 uppercase">Census ACS Historical Shifts</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-black text-white">Real-Time</p>
            <p className="text-[11px] text-zinc-400 uppercase">Spatial Snapshot Diffing</p>
          </div>
        </div>
      </section>

      {/* LIVE SPATIAL INTELLIGENCE SCANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mono-card rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                  Live Spatial Intelligence
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Interact with the scanner below to preview real-time neighborhood detection
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {Object.entries(PREVIEW_CATEGORIES).map(([key, cat]) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveCategory(key);
                      const items = SIMULATOR_DATA[key] || SIMULATOR_DATA.all;
                      if (items.length > 0) setSelectedBlipId(items[0].id);
                    }}
                    className={`btn-interactive px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Radar & Results Dual Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* RADAR CANVAS SIMULATOR (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden shadow-2xl">
                
                {/* Concentric Radar Rings */}
                <div className="absolute inset-4 rounded-full border border-zinc-900" />
                <div className="absolute inset-12 rounded-full border border-zinc-900" />
                <div className="absolute inset-20 rounded-full border border-zinc-900" />
                <div className="absolute w-full h-[1px] bg-zinc-900" />
                <div className="absolute h-full w-[1px] bg-zinc-900" />

                {/* Animated Radar Sweep Line */}
                <div 
                  className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 290deg, rgba(255, 255, 255, 0.15) 360deg)'
                  }}
                />

                {/* Center Core */}
                <div className="w-3 h-3 rounded-full bg-white shadow-glow relative z-10" />

                {/* Pulsing Interactive Blips */}
                {currentItems.map((item) => {
                  const isSelected = item.id === (activeBlip?.id || selectedBlipId);
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedBlipId(item.id)}
                      className={`btn-interactive absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all cursor-pointer z-20 ${
                        isSelected
                          ? 'w-4 h-4 bg-white ring-4 ring-white/30 scale-125'
                          : 'w-2.5 h-2.5 bg-zinc-400 hover:bg-white'
                      }`}
                      style={{ left: `${item.x}%`, top: `${item.y}%` }}
                      title={item.name}
                    />
                  );
                })}

                {/* Radar Subtitle Indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-500 uppercase tracking-widest pointer-events-none">
                  RADAR SECTOR 3.5KM
                </div>
              </div>
            </div>

            {/* RADAR EVENT DETAILS (7 cols) */}
            <div className="lg:col-span-7 space-y-4 font-mono">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-Time Detected Events ({currentItems.length})</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">Click card or blip</span>
                </div>

                <div className="space-y-2.5">
                  {currentItems.map((item) => {
                    const isSelected = item.id === (activeBlip?.id || selectedBlipId);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedBlipId(item.id)}
                        className={`btn-interactive p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 border-white shadow-xl scale-[1.01]'
                            : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {item.type === 'business_opened' && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white text-black">
                                + NEW PLACE
                              </span>
                            )}
                            {item.type === 'business_removed' && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                                − UNLISTED
                              </span>
                            )}
                            {item.type === 'business_modified' && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-zinc-800 text-zinc-200 border border-zinc-700">
                                Δ MODIFIED
                              </span>
                            )}
                            <span className="text-xs text-zinc-400 font-bold">{item.category}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">{item.timeAgo}</span>
                        </div>

                        <div className="flex items-center justify-between mt-1 font-sans">
                          <h4 className="text-sm font-bold text-white">{item.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-400 font-bold">{item.sigScore} pts</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">{item.address}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3-STEP ENGINE HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-800/80">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            How The Intelligence Engine Works
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Autonomous multi-source spatial resolution in under 2 seconds
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="mono-card mono-card-hover p-6 rounded-2xl border border-zinc-800 space-y-3">
            <span className="text-2xl font-black text-zinc-700 block">01</span>
            <h3 className="text-base font-bold text-white uppercase font-sans">Enter Any US ZIP</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-normal">
              Resolves dynamic 3,500m bounding perimeters, geocoding coordinates, and official US Census Bureau ZCTA boundaries.
            </p>
          </div>

          <div className="mono-card mono-card-hover p-6 rounded-2xl border border-zinc-800 space-y-3">
            <span className="text-2xl font-black text-zinc-700 block">02</span>
            <h3 className="text-base font-bold text-white uppercase font-sans">Historical Diffing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-normal">
              Compares latest spatial records against previous captures to detect new physical additions, tag modifications, and unlisted entities.
            </p>
          </div>

          <div className="mono-card mono-card-hover p-6 rounded-2xl border border-zinc-800 space-y-3">
            <span className="text-2xl font-black text-zinc-700 block">03</span>
            <h3 className="text-base font-bold text-white uppercase font-sans">AI Synthesis & Map</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-normal">
              Generates executive summaries, significance scoring (0–100), and interactive vector map exploration.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED METROS EXPLORER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Featured Metro Explorers
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Select any American commercial hub for immediate spatial scanning
            </p>
          </div>
          <Link
            href="/explore"
            className="btn-interactive text-xs font-mono font-bold text-white hover:underline flex items-center gap-1.5"
          >
            <span>View All US Metros</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
          {FEATURED_METROS.map((metro) => (
            <Link
              key={metro.zip}
              href={`/area/${metro.zip}`}
              className="btn-interactive mono-card mono-card-hover p-5 rounded-xl border border-zinc-800 hover:border-zinc-500 space-y-3 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  ZIP {metro.zip}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase">{metro.tag}</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-white font-sans group-hover:text-zinc-200">
                  {metro.city}, {metro.state}
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">{metro.neighborhood}</p>
              </div>
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-400">
                <span>View Timeline</span>
                <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* INTERACTIVE FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            Everything you need to know about What Changed Around Me
          </p>
        </div>

        <div className="space-y-3 font-mono">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="mono-card rounded-xl border border-zinc-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="btn-interactive w-full p-4.5 text-left flex items-center justify-between gap-4 cursor-pointer text-xs font-bold text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4.5 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900 bg-zinc-950/50 animate-fade-in-up font-sans font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-10 text-xs text-zinc-500 font-mono relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-white font-bold tracking-wider uppercase">What Changed Around Me</p>
            <p className="text-zinc-500 text-[11px]">
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
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-zinc-400 text-xs">
            <Link href="/compare" className="hover:text-white transition-colors">Compare</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="hover:text-white transition-colors cursor-pointer text-zinc-500" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Top ↑
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
