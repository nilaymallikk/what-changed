import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for What Changed Around Me open-access neighborhood intelligence platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      
      {/* Top Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
            Terms of Service
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            Last updated: August 2026 • Legal & Platform Scope
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
          <span className="px-4 py-2 rounded-lg font-bold bg-white text-black flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </span>
          <Link
            href="/privacy"
            className="btn-interactive px-4 py-2 rounded-lg font-bold text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 transition-colors"
          >
            <span>Privacy Policy</span>
          </Link>
        </div>

        <div className="mono-card p-8 rounded-2xl border border-zinc-800 space-y-6 text-xs text-zinc-300 font-sans leading-relaxed">
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
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-5 text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/compare" className="hover:text-white transition-colors">Compare</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
