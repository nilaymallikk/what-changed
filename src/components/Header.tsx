'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Compass, Database } from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const isDashboardOrDetail = pathname?.startsWith('/area/');

  // Do not render top header on Area Dashboard or Change Detail pages (where sidebar is active)
  if (isDashboardOrDetail) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black group-hover:bg-zinc-200 transition-colors">
            <Zap className="w-4 h-4 fill-black" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-black tracking-wider text-white uppercase font-sans">
              WHAT CHANGED <span className="text-zinc-400">AROUND ME</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
          <Link
            href="/compare"
            className="btn-interactive px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all flex items-center gap-1.5"
          >
            <span className="hidden sm:inline">Compare Areas</span>
            <span className="sm:hidden">Compare</span>
          </Link>

          <Link
            href="/explore"
            className="btn-interactive px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Explore Metros</span>
            <span className="sm:hidden">Explore</span>
          </Link>

          <Link
            href="/data-sources"
            className="btn-interactive px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Data Sources</span>
            <span className="sm:hidden">Data</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
