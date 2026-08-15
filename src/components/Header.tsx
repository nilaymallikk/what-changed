import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Shield, Zap } from 'lucide-react';
import { isValidUSZip } from '../services/geocoding';

export const Header: React.FC = () => {
  const [zipInput, setZipInput] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipInput.trim();
    if (isValidUSZip(cleanZip)) {
      navigate(`/area/${cleanZip}`);
      setZipInput('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black group-hover:bg-zinc-200 transition-colors">
            <Zap className="w-4 h-4 fill-black" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-black tracking-wider text-white uppercase">
              WHAT CHANGED <span className="text-zinc-400">AROUND ME</span>
            </span>
          </div>
        </Link>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search US ZIP (e.g. 90210)..."
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              className="w-full bg-zinc-950 text-white text-xs pl-9 pr-20 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-white transition-all placeholder:text-zinc-600 font-mono"
              maxLength={5}
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white hover:bg-zinc-200 text-black font-extrabold text-[10px] uppercase rounded transition-colors"
            >
              GO
            </button>
          </div>
        </form>

        {/* Navigation Links */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Pipeline Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
