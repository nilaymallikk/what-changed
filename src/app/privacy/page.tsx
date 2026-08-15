import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for What Changed Around Me — Zero Tracking & Client-Side Privacy Guarantees.',
  alternates: {
    canonical: 'https://whatchangedaround.me/privacy',
  },
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            Last updated: August 2026 • Zero Tracking Guarantees
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
          <Link
            href="/terms"
            className="btn-interactive px-4 py-2 rounded-lg font-bold text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 transition-colors"
          >
            <span>Terms of Service</span>
          </Link>
          <span className="px-4 py-2 rounded-lg font-bold bg-white text-black flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </span>
        </div>

        <div className="mono-card p-8 rounded-2xl border border-zinc-800 space-y-6 text-xs text-zinc-300 font-sans leading-relaxed">
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
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
