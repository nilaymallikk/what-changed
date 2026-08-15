import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, FileText, ArrowLeft } from 'lucide-react';

export const LegalPage: React.FC = () => {
  const location = useLocation();
  const initialTab = location.pathname.includes('privacy') ? 'privacy' : 'terms';
  const [tab, setTab] = useState<'terms' | 'privacy'>(initialTab);

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
            {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            Last updated: August 2026 • Legal & Privacy Principles
          </p>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
          <button
            onClick={() => setTab('terms')}
            className={`btn-interactive px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'terms' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => setTab('privacy')}
            className={`btn-interactive px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'privacy' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="mono-card p-8 rounded-2xl border border-zinc-800 space-y-6 text-xs text-zinc-300 font-sans leading-relaxed">
          {tab === 'terms' ? (
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase">1. Platform Scope & Purpose</h3>
                <p>
                  "What Changed Around Me" provides open-access spatial diffing, demographic tracking, and public record analytics for American neighborhoods. All insights are generated from publicly available datasets including geographic mapping revisions, Wikipedia Geosearch metadata, and US Census Bureau ACS estimates.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase">2. Accuracy & Third-Party Records</h3>
                <p>
                  Information displayed on this website reflects community mapping contributions and federal census statistics. We do not warrant that all geographic coordinates, operating hours, or status tags are error-free. Users making commercial, legal, or real estate decisions should verify facts independently.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase">3. Acceptable Use</h3>
                <p>
                  You agree to use this platform in compliance with all applicable local, state, and federal laws. Automated scraping must respect reasonable request rates and open API terms.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase">1. Zero Persistent Tracking</h3>
                <p>
                  We believe privacy is fundamental. We do not track individual users across the web, do not sell personal data to third parties, and do not require account creation for browsing neighborhood intelligence.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase">2. Local Storage & Client Cache</h3>
                <p>
                  To accelerate map rendering and provide fast query responses, our application caches snapshot results in your browser's local storage. This data remains on your device and can be cleared at any time through your browser settings.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase">3. Open External APIs</h3>
                <p>
                  When performing spatial searches, anonymous queries are transmitted to public geocoding services and open mapping APIs strictly for the requested 5-digit ZIP code without associating personal user identifiers.
                </p>
              </section>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
