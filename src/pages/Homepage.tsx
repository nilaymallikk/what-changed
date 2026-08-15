import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, ShieldCheck, Database, Cpu } from 'lucide-react';
import { isValidUSZip } from '../services/geocoding';

export const Homepage: React.FC = () => {
  const [zipInput, setZipInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
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

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between">
      
      {/* HERO SECTION */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center space-y-8 relative z-10 animate-fade-in-up">
        
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>OpenStreetMap Neighborhood Intelligence</span>
        </div>

        {/* Hero Headline */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-none">
            WHAT CHANGED <br />
            <span className="text-zinc-500">AROUND ME?</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Enter a US ZIP code to track place changes, new business additions, and listing removals detected across historical OpenStreetMap snapshot data.
          </p>
        </div>

        {/* Crisp Pure Black & White Search Box */}
        <div className="max-w-md mx-auto pt-2">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative bg-zinc-950 p-2 rounded-xl border border-zinc-700 flex items-center gap-2 focus-within:border-white transition-all shadow-xl">
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
                className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs font-mono font-semibold text-rose-400">{errorMsg}</p>
            )}
          </form>

          {/* Popular ZIP Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            <span className="text-zinc-500 mr-1">Popular:</span>
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
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition-colors"
              >
                {item.zip} <span className="text-zinc-500">({item.label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          
          <div className="mono-card mono-card-hover p-5 rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Snapshot Diffing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Compares historical and current OpenStreetMap state captures to detect new additions and removals.
            </p>
          </div>

          <div className="mono-card mono-card-hover p-5 rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Summarization</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Generates concise executive neighborhood briefs using high-capacity LLMs via OpenRouter.
            </p>
          </div>

          <div className="mono-card mono-card-hover p-5 rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Disappearance Logic</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Responsible flagging labels vanished entities as "No longer listed in snapshot" rather than making assumptions.
            </p>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 font-mono relative z-10">
        <p>© 2026 What Changed Around Me • OpenStreetMap Data Engine</p>
      </footer>

    </div>
  );
};
