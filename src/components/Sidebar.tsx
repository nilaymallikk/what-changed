'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Clock, Search, Home 
} from 'lucide-react';

import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  currentZip?: string;
  activeSection?: 'overview' | 'demographics' | 'timeline';
  onSectionClick?: (section: 'overview' | 'demographics' | 'timeline') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentZip = '10001', 
  activeSection = 'overview',
  onSectionClick 
}) => {
  const pathname = usePathname();
  const isDetailPage = pathname?.includes('/change/');

  const handleNav = (section: 'overview' | 'demographics' | 'timeline') => {
    if (onSectionClick) {
      onSectionClick(section);
    }
  };

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 min-h-screen text-zinc-400 font-mono text-xs select-none">
      
      {/* Top Header & Brand */}
      <div>
        <div className="p-5 border-b border-zinc-800/80">
          <Link href="/" className="flex items-center gap-3 group">
            <BrandLogo className="w-7 h-7 shrink-0 group-hover:scale-105 transition-transform" />
            <div>
              <h2 className="text-sm font-black tracking-tight text-white uppercase group-hover:text-zinc-200 transition-colors font-sans leading-none">
                WHAT CHANGED
              </h2>
              <span className="text-[10px] text-zinc-500 tracking-wider block mt-1 font-mono uppercase">
                Spatial Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5 font-mono">
          <Link
            href={`/area/${currentZip}`}
            onClick={() => handleNav('overview')}
            className={`btn-interactive flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'overview' && !isDetailPage
                ? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-zinc-300 shrink-0" />
            <span>Overview</span>
          </Link>

          <button
            onClick={() => handleNav('demographics')}
            className={`btn-interactive w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
              activeSection === 'demographics'
                ? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Users className="w-4 h-4 text-zinc-300 shrink-0" />
            <span>Demographics</span>
          </button>

          <button
            onClick={() => handleNav('timeline')}
            className={`btn-interactive w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
              activeSection === 'timeline' || isDetailPage
                ? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Clock className="w-4 h-4 text-zinc-300 shrink-0" />
            <span>Timeline</span>
          </button>

          <Link
            href={`/compare?zipA=${currentZip}`}
            className="btn-interactive flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-all"
          >
            <Search className="w-4 h-4 text-zinc-300 shrink-0" />
            <span>Compare Area</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-zinc-800/80 space-y-2">
        <Link
          href="/"
          className="btn-interactive flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <Search className="w-4 h-4 text-zinc-500" />
          <span>Search New ZIP</span>
        </Link>
        <Link
          href="/"
          className="btn-interactive flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <Home className="w-4 h-4 text-zinc-500" />
          <span>Back to Home</span>
        </Link>
      </div>

    </aside>
  );
};
