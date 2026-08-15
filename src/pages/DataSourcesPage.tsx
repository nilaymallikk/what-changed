import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Database, ShieldCheck, Globe, Users, CheckCircle2, ArrowLeft, ArrowRight 
} from 'lucide-react';

export const DataSourcesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      
      {/* Top Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
            Data Sources & Methodology
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            How What Changed Around Me calculates neighborhood change intelligence using 100% open public records
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 font-mono text-xs leading-relaxed">
        
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mono-card p-5 rounded-xl border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase">Spatial Overpass</h3>
            <p className="text-zinc-400 font-sans font-normal leading-normal">
              High-frequency multi-mirror queries aggregating 3,500m radius geographic POI revisions and status tags.
            </p>
          </div>

          <div className="mono-card p-5 rounded-xl border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase">Wikipedia Geosearch</h3>
            <p className="text-zinc-400 font-sans font-normal leading-normal">
              Direct integration capturing civic landmarks, historic institutions, and Wikimedia Commons photography.
            </p>
          </div>

          <div className="mono-card p-5 rounded-xl border border-zinc-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase">US Census Bureau</h3>
            <p className="text-zinc-400 font-sans font-normal leading-normal">
              ACS 5-Year demographic and economic data aggregated at the ZCTA level across 1, 5, and 10-year timelines.
            </p>
          </div>
        </div>

        {/* Deep Dive Sections */}
        <div className="space-y-8">
          
          <div className="mono-card p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>1. Change Classification Rules</span>
            </h2>
            <div className="space-y-3 font-sans text-xs text-zinc-300 font-normal leading-relaxed">
              <p>
                Every detected entity is deterministically classified into one of three temporal categories:
              </p>
              <ul className="space-y-2 pl-4 list-disc text-zinc-400">
                <li>
                  <strong className="text-white font-mono uppercase text-[11px]">+ NEW PLACE (business_opened)</strong>: Assigned when an entity is first indexed in local mapping records (version 1) or has an explicit start date in the target period.
                </li>
                <li>
                  <strong className="text-white font-mono uppercase text-[11px]">Δ MODIFIED (business_modified)</strong>: Assigned when an entity undergoes verified modifications to its name, category, operating hours, phone, or address attributes.
                </li>
                <li>
                  <strong className="text-white font-mono uppercase text-[11px]">− UNLISTED (business_removed)</strong>: Assigned when an entity is explicitly tagged with disused/closed flags or ceases to appear in active area snapshots.
                </li>
              </ul>
            </div>
          </div>

          <div className="mono-card p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>2. Responsible Disappearance & Privacy Guarantees</span>
            </h2>
            <div className="space-y-3 font-sans text-xs text-zinc-300 font-normal leading-relaxed">
              <p>
                Our platform adheres to strict consumer data integrity principles:
              </p>
              <ul className="space-y-2 pl-4 list-disc text-zinc-400">
                <li>
                  <strong>No Tracking</strong>: All ZIP lookups and spatial boundary queries are processed without collecting user IP addresses or persistent identifiers.
                </li>
                <li>
                  <strong>Disclaimers on Unlisted Entities</strong>: Disappearance from a public map capture does not constitute a legal or commercial guarantee of bankruptcy or closure. All records are labeled as "Unlisted in active area records".
                </li>
                <li>
                  <strong>Open Access</strong>: All queries are executed against open data endpoints with zero paywalls.
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom CTA */}
        <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
          <Link to="/" className="btn-interactive px-4 py-2.5 bg-white text-black font-bold text-xs uppercase rounded-lg flex items-center gap-1.5">
            <span>Explore Live Areas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-10 text-xs text-zinc-500 font-mono">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>
            Built by{' '}
            <a
              href="https://x.com/nilaymallikX"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white font-bold underline decoration-zinc-700 underline-offset-2 transition-colors"
            >
              Nilay Mallik
            </a>{' '}
            (<a href="https://x.com/nilaymallikX" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">@nilaymallikX</a>)
          </p>
          <div className="flex flex-wrap items-center gap-5 text-zinc-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
