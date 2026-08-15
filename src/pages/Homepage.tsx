import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, ArrowRight, Compass, Utensils, ShoppingBag, 
  Landmark, Activity, ChevronDown 
} from 'lucide-react';
import { isValidUSZip } from '../services/geocoding';

interface PreviewItem {
  id: string;
  name: string;
  category: string;
  type: 'opened' | 'modified' | 'removed';
  address: string;
  timeAgo: string;
  latOffset: number;
  lngOffset: number;
}

const PREVIEW_CATEGORIES: Record<string, { label: string; icon: React.FC<{ className?: string }>; items: PreviewItem[] }> = {
  all: {
    label: 'All Activity',
    icon: Compass,
    items: [
      { id: '1', name: 'Blue Bottle Coffee & Roastery', category: 'Coffee & Cafe', type: 'opened', address: 'Wilshire Blvd', timeAgo: '2 days ago', latOffset: 25, lngOffset: 30 },
      { id: '2', name: 'Civic Arts Pavilion', category: 'Civic & Historic', type: 'opened', address: 'Rexford Dr', timeAgo: '1 week ago', latOffset: -35, lngOffset: 45 },
      { id: '3', name: 'Metropolitan Boutique', category: 'Retail (Fashion)', type: 'modified', address: 'Rodeo Dr', timeAgo: '3 weeks ago', latOffset: -20, lngOffset: -40 },
      { id: '4', name: 'Corner Grocery Store', category: 'Supermarket', type: 'removed', address: 'Bedford Dr', timeAgo: '1 month ago', latOffset: 40, lngOffset: -30 }
    ]
  },
  dining: {
    label: 'Dining & Cafes',
    icon: Utensils,
    items: [
      { id: '1', name: 'Blue Bottle Coffee & Roastery', category: 'Coffee & Cafe', type: 'opened', address: 'Wilshire Blvd', timeAgo: '2 days ago', latOffset: 25, lngOffset: 30 },
      { id: '5', name: 'Osteria Bella Vista', category: 'Italian Restaurant', type: 'opened', address: 'Canon Dr', timeAgo: '5 days ago', latOffset: 15, lngOffset: -20 },
      { id: '6', name: 'Le Petit Boulangerie', category: 'Bakery', type: 'modified', address: 'Beverly Dr', timeAgo: '2 weeks ago', latOffset: -10, lngOffset: 35 }
    ]
  },
  retail: {
    label: 'Retail & Fashion',
    icon: ShoppingBag,
    items: [
      { id: '3', name: 'Metropolitan Boutique', category: 'Retail (Fashion)', type: 'modified', address: 'Rodeo Dr', timeAgo: '3 weeks ago', latOffset: -20, lngOffset: -40 },
      { id: '7', name: 'Nordic Home Living', category: 'Furniture & Design', type: 'opened', address: 'Dayton Way', timeAgo: '4 days ago', latOffset: 35, lngOffset: 15 },
      { id: '4', name: 'Corner Grocery Store', category: 'Supermarket', type: 'removed', address: 'Bedford Dr', timeAgo: '1 month ago', latOffset: 40, lngOffset: -30 }
    ]
  },
  civic: {
    label: 'Civic & Landmarks',
    icon: Landmark,
    items: [
      { id: '2', name: 'Civic Arts Pavilion', category: 'Civic & Historic', type: 'opened', address: 'Rexford Dr', timeAgo: '1 week ago', latOffset: -35, lngOffset: 45 },
      { id: '8', name: 'Municipal Botanical Garden', category: 'Public Park', type: 'modified', address: 'Santa Monica Blvd', timeAgo: '2 months ago', latOffset: -45, lngOffset: -15 }
    ]
  }
};

const METROS = [
  { zip: '90210', city: 'Beverly Hills', state: 'CA', count: '142 Tracked Places' },
  { zip: '10001', city: 'New York (Chelsea / Hudson Yards)', state: 'NY', count: '328 Tracked Places' },
  { zip: '33139', city: 'Miami Beach (South Beach)', state: 'FL', count: '189 Tracked Places' },
  { zip: '77005', city: 'Houston (Rice Village)', state: 'TX', count: '115 Tracked Places' },
  { zip: '60611', city: 'Chicago (Streeterville)', state: 'IL', count: '210 Tracked Places' },
  { zip: '94102', city: 'San Francisco (Civic Center)', state: 'CA', count: '264 Tracked Places' }
];

const FAQS = [
  {
    q: 'How does What Changed detect place openings and closures?',
    a: 'Our engine tracks verified geographic change records, creation timestamps, attribute modifications, and status tags over time across physical entities and civic landmarks.'
  },
  {
    q: 'Is this service free to use?',
    a: 'Yes, 100% free and open-access. There are no paywalls, accounts, or subscriptions required.'
  },
  {
    q: 'What types of neighborhood changes are tracked?',
    a: 'We track newly opened businesses (+ NEW), verified attribute updates like name changes or address relocations (Δ MODIFIED), and entities marked as unlisted or closed (− UNLISTED).'
  },
  {
    q: 'What demographic data is included?',
    a: 'We integrate US Census Bureau American Community Survey (ACS) datasets to show 1-year, 5-year, and 10-year demographic, housing occupancy, and income shifts.'
  }
];

export const Homepage: React.FC = () => {
  const [zipInput, setZipInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>('1');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipInput.trim();

    if (!cleanZip) {
      setErrorMsg('Please enter a 5-digit US ZIP code.');
      return;
    }

    if (!isValidUSZip(cleanZip)) {
      setErrorMsg('Invalid US ZIP code. Please enter 5 digits.');
      return;
    }

    setErrorMsg('');
    navigate(`/area/${cleanZip}`);
  };

  const handleQuickZip = (zip: string) => {
    navigate(`/area/${zip}`);
  };

  const currentPreview = PREVIEW_CATEGORIES[activeCategory] || PREVIEW_CATEGORIES.all;

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between overflow-x-hidden selection:bg-white selection:text-black">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-zinc-800/10 blur-[120px] pointer-events-none -z-0" />

      {/* HERO SECTION */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 text-center space-y-8 relative z-10 animate-fade-in-up">

        {/* Hero Headline */}
        <div className="space-y-5 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-none">
            WHAT CHANGED <br />
            <span className="shimmer-text">AROUND ME?</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Enter any US ZIP code to explore real-time place openings, venue modifications, and 10-year demographic trends in your neighborhood.
          </p>
        </div>

        {/* Crisp Search Box */}
        <div className="max-w-md mx-auto pt-2">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative bg-zinc-950 p-2 rounded-xl border border-zinc-700 flex items-center gap-2 focus-within:border-white transition-all shadow-2xl hover:border-zinc-500">
              <div className="pl-3 text-zinc-400">
                <MapPin className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Enter 5-digit ZIP (e.g. 90210, 77005)..."
                value={zipInput}
                onChange={(e) => {
                  setZipInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full bg-transparent text-white placeholder-zinc-500 text-sm font-mono px-2 py-2.5 focus:outline-none"
                maxLength={5}
              />
              <button
                type="submit"
                className="btn-interactive px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs font-mono font-semibold text-rose-400 animate-fade-in-up">{errorMsg}</p>
            )}
          </form>

          {/* Popular ZIP Quick Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            <span className="text-zinc-500 mr-1">Trending:</span>
            {[
              { zip: '90210', label: 'Beverly Hills' },
              { zip: '77005', label: 'Houston' },
              { zip: '10001', label: 'New York' },
              { zip: '33139', label: 'Miami Beach' },
              { zip: '60611', label: 'Chicago' },
              { zip: '94102', label: 'San Francisco' }
            ].map(item => (
              <button
                key={item.zip}
                onClick={() => handleQuickZip(item.zip)}
                className="btn-interactive px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition-all cursor-pointer"
              >
                {item.zip} <span className="text-zinc-500">({item.label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* METRIC COUNTER TICKER */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto font-mono text-left">
          <div className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-xl">
            <span className="text-xl sm:text-2xl font-black text-white block">41,000+</span>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">US ZIP Codes</span>
          </div>
          <div className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-xl">
            <span className="text-xl sm:text-2xl font-black text-white block">100% Free</span>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Open Access</span>
          </div>
          <div className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-xl">
            <span className="text-xl sm:text-2xl font-black text-white block">10-Year</span>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Census Deltas</span>
          </div>
          <div className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-xl">
            <span className="text-xl sm:text-2xl font-black text-white block">Real-Time</span>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Spatial Scans</span>
          </div>
        </div>

      </div>

      {/* INTERACTIVE RADAR & SCANNER SIMULATION */}
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
                      setSelectedPreviewId(cat.items[0]?.id || '1');
                    }}
                    className={`btn-interactive px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-extrabold border-white shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Radar & Results Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left: Animated Radar Grid */}
            <div className="lg:col-span-6 relative aspect-square max-w-sm mx-auto w-full bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center p-4">
              
              {/* Concentric Radar Rings */}
              <div className="absolute w-[80%] h-[80%] rounded-full border border-zinc-800/80" />
              <div className="absolute w-[55%] h-[55%] rounded-full border border-zinc-800/80" />
              <div className="absolute w-[30%] h-[30%] rounded-full border border-zinc-800/80" />
              <div className="absolute w-full h-[1px] bg-zinc-800/60" />
              <div className="absolute h-full w-[1px] bg-zinc-800/60" />

              {/* Rotating Radar Sweep Line */}
              <div className="absolute w-full h-full origin-center animate-radar-sweep pointer-events-none">
                <div className="w-1/2 h-1/2 bg-gradient-to-tr from-transparent via-white/10 to-white/20 origin-bottom-right rounded-tl-full" />
              </div>

              {/* Center Pin */}
              <div className="relative z-10 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                <div className="w-1.5 h-1.5 rounded-full bg-black" />
              </div>

              {/* Dynamic Animated Radar Blips */}
              {currentPreview.items.map((item) => {
                const isSelected = selectedPreviewId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPreviewId(item.id)}
                    style={{
                      transform: `translate(${item.lngOffset * 2.5}px, ${item.latOffset * 2.5}px)`
                    }}
                    className={`btn-interactive absolute z-20 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white text-black scale-125 shadow-[0_0_20px_rgba(255,255,255,0.9)] ring-4 ring-zinc-700'
                        : 'bg-zinc-900 border border-zinc-600 text-zinc-300 hover:scale-110 hover:border-white'
                    }`}
                    title={item.name}
                  >
                    <span className="text-[10px] font-black">
                      {item.type === 'opened' ? '+' : item.type === 'removed' ? '−' : 'Δ'}
                    </span>
                  </button>
                );
              })}

              <div className="absolute bottom-3 left-3 text-[10px] font-mono text-zinc-600">
                <span>R: 3,500m • LIVE SCAN</span>
              </div>
            </div>

            {/* Right: Interactive Result Cards */}
            <div className="lg:col-span-6 space-y-3 font-mono">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">
                Detected Changes in Sector ({currentPreview.items.length})
              </span>

              {currentPreview.items.map((item) => {
                const isSelected = selectedPreviewId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPreviewId(item.id)}
                    className={`btn-interactive p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 border-white shadow-xl scale-[1.01]'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {item.type === 'opened' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white text-black">
                            + NEW PLACE
                          </span>
                        )}
                        {item.type === 'modified' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-200 border border-zinc-600">
                            Δ MODIFIED
                          </span>
                        )}
                        {item.type === 'removed' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                            − UNLISTED
                          </span>
                        )}
                        <span className="text-xs text-zinc-400">{item.category}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500">{item.timeAgo}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white font-sans mt-1">{item.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      <span>{item.address}</span>
                    </p>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS 3-STEP FLOW */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            How The Intelligence Engine Works
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Deterministic spatial data extraction from public community records
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="mono-card mono-card-hover p-6 rounded-2xl space-y-3 relative group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-mono font-black text-sm group-hover:bg-white group-hover:text-black transition-colors">
              01
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide">Enter Any US ZIP</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Resolves precise latitude/longitude boundaries, Census ZCTA identifiers, and municipality parameters in milliseconds.
            </p>
          </div>

          <div className="mono-card mono-card-hover p-6 rounded-2xl space-y-3 relative group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-mono font-black text-sm group-hover:bg-white group-hover:text-black transition-colors">
              02
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide">Historical Snapshot Diffing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Aggregates revision histories, timestamps, and attributes to deterministically classify new additions, updates, and closures.
            </p>
          </div>

          <div className="mono-card mono-card-hover p-6 rounded-2xl space-y-3 relative group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-mono font-black text-sm group-hover:bg-white group-hover:text-black transition-colors">
              03
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide">AI Synthesis & Map View</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Delivers synchronized interactive vector maps, chronological timelines, 10-year demographic deltas, and AI executive summaries.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED METROS EXPLORER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Explore Key Metro Areas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Click any area to jump directly into its live change dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {METROS.map((metro) => (
            <button
              key={metro.zip}
              onClick={() => handleQuickZip(metro.zip)}
              className="btn-interactive mono-card mono-card-hover p-5 rounded-xl text-left border border-zinc-800 hover:border-zinc-500 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-white font-mono font-black text-xs">
                    ZIP {metro.zip}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-zinc-400" />
                    <span>Live</span>
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-3 font-sans">{metro.city}</h4>
                <span className="text-xs text-zinc-400 font-mono block mt-0.5">{metro.state}, United States</span>
              </div>

              <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">{metro.count}</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
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
            <p className="text-zinc-500 text-[11px]">© 2026 Open-Access Spatial Intelligence & Demographic Trends</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-zinc-400 text-xs">
            <Link to="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link to="/data-sources" className="hover:text-white transition-colors">Data Sources</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="hover:text-white transition-colors cursor-pointer text-zinc-500" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Top ↑
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
