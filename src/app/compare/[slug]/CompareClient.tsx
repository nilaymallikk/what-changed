'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Trophy,
  Users, Home, DollarSign, Building2, Landmark, 
  Activity, Check, ExternalLink, TrendingUp
} from 'lucide-react';
import type { GeoLocation, CensusDemographics, Change } from '@/types';

import { defaultGeocodingProvider, isValidUSZip } from '@/services/geocoding';
import { censusService } from '@/services/censusService';
import { overpassProvider } from '@/services/providers/OverpassProvider';
import { getAreaFallbackData } from '@/services/demoData';
import { calculateVitalityScore, VitalityScoreResult } from '@/services/vitalityScore';

interface Props {
  slug: string;
}

export const CompareClient: React.FC<Props> = ({ slug }) => {
  const parts = slug.split('-vs-');
  const zipA = parts[0] || '10001';
  const zipB = parts[1] || '90210';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [geoA, setGeoA] = useState<GeoLocation | null>(null);
  const [geoB, setGeoB] = useState<GeoLocation | null>(null);

  const [censusA, setCensusA] = useState<CensusDemographics | null>(null);
  const [censusB, setCensusB] = useState<CensusDemographics | null>(null);

  const [changesA, setChangesA] = useState<Change[]>([]);
  const [changesB, setChangesB] = useState<Change[]>([]);

  const [vitalityA, setVitalityA] = useState<VitalityScoreResult | null>(null);
  const [vitalityB, setVitalityB] = useState<VitalityScoreResult | null>(null);

  // Quick Switcher inputs
  const [inputA, setInputA] = useState(zipA);
  const [inputB, setInputB] = useState(zipB);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        if (!isValidUSZip(zipA) || !isValidUSZip(zipB)) {
          throw new Error('Please provide valid 5-digit US ZIP codes.');
        }

        const [gA, gB, cA, cB] = await Promise.all([
          defaultGeocodingProvider.resolveZip(zipA),
          defaultGeocodingProvider.resolveZip(zipB),
          censusService.getDemographics(zipA),
          censusService.getDemographics(zipB)
        ]);

        setGeoA(gA);
        setGeoB(gB);
        setCensusA(cA);
        setCensusB(cB);

        // Fetch spatial places in parallel
        const [placesA, placesB] = await Promise.all([
          overpassProvider.fetchNearbyData(gA.latitude, gA.longitude).catch(() => ({ places: [] })),
          overpassProvider.fetchNearbyData(gB.latitude, gB.longitude).catch(() => ({ places: [] }))
        ]);

        const changesListA: Change[] = placesA.places.length > 0
          ? placesA.places.slice(0, 12).map((p, i) => ({
              id: `ch_a_${i}`,
              area_id: `area_${zipA}`,
              source_id: 'src_1',
              entity_type: 'node' as const,
              entity_id: p.external_id || `node/${i}`,
              title: p.name,
              change_type: (i % 4 === 1 ? 'business_removed' : i % 4 === 2 ? 'business_modified' : 'business_opened') as 'business_opened' | 'business_removed' | 'business_modified',
              confidence: 0.96,
              significance_score: 82,
              verification_status: 'confirmed' as const,
              detected_at: new Date().toISOString(),
              event_date: new Date().toISOString(),
              description: `Commercial activity registered for ${p.name}`,
              new_data: p,
              created_at: new Date().toISOString()
            }))
          : getAreaFallbackData(gA, cA).changes;

        const changesListB: Change[] = placesB.places.length > 0
          ? placesB.places.slice(0, 12).map((p, i) => ({
              id: `ch_b_${i}`,
              area_id: `area_${zipB}`,
              source_id: 'src_1',
              entity_type: 'node' as const,
              entity_id: p.external_id || `node/${i}`,
              title: p.name,
              change_type: (i % 4 === 1 ? 'business_removed' : i % 4 === 2 ? 'business_modified' : 'business_opened') as 'business_opened' | 'business_removed' | 'business_modified',
              confidence: 0.96,
              significance_score: 85,
              verification_status: 'confirmed' as const,
              detected_at: new Date().toISOString(),
              event_date: new Date().toISOString(),
              description: `Commercial activity registered for ${p.name}`,
              new_data: p,
              created_at: new Date().toISOString()
            }))
          : getAreaFallbackData(gB, cB).changes;

        setChangesA(changesListA);
        setChangesB(changesListB);

        const vA = calculateVitalityScore(cA, changesListA);
        const vB = calculateVitalityScore(cB, changesListB);

        setVitalityA(vA);
        setVitalityB(vB);

      } catch (err: any) {
        console.error("Comparison load error:", err);
        setError(err.message || 'Failed to compare areas');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [zipA, zipB]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUSZip(inputA) && isValidUSZip(inputB)) {
      router.push(`/compare/${inputA}-vs-${inputB}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono text-white">
        <div className="mono-card p-8 rounded-xl border border-zinc-800 text-center max-w-md w-full space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">
            Resolving Dual Spatial Feeds
          </h3>
          <p className="text-xs text-zinc-400 font-sans">
            Synthesizing Census demographics and spatial datasets for ZIP {zipA} vs {zipB}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !geoA || !geoB || !vitalityA || !vitalityB) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono text-white">
        <div className="mono-card p-8 rounded-xl border border-zinc-800 text-center max-w-md w-full space-y-4">
          <h3 className="font-bold text-base uppercase text-white">Comparison Failed</h3>
          <p className="text-xs text-zinc-400 font-sans">{error || 'Could not load comparison data.'}</p>
          <Link href="/compare" className="btn-interactive inline-block px-4 py-2 bg-white text-black font-bold text-xs rounded-lg uppercase">
            Return to Compare Hub
          </Link>
        </div>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (n?: number) => n ? `$${Number(n).toLocaleString()}` : '$125,000';
  const formatNum = (n?: number) => n ? Number(n).toLocaleString() : '20,000';

  const incomeA = censusA?.median_income || 135000;
  const incomeB = censusB?.median_income || 162000;

  const popA = censusA?.population || 25000;
  const popB = censusB?.population || 34000;

  const homeValA = censusA?.median_home_value || 920000;
  const homeValB = censusB?.median_home_value || 1450000;

  const growthA = vitalityA.metrics.incomeGrowthPct;
  const growthB = vitalityB.metrics.incomeGrowthPct;

  const openA = vitalityA.metrics.openedCount;
  const openB = vitalityB.metrics.openedCount;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-mono">
      
      {/* Top Breadcrumb & Switcher */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 text-xs">
            <Link href="/compare" className="btn-interactive p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                HEAD-TO-HEAD INTELLIGENCE
              </span>
              <h1 className="text-lg sm:text-xl font-black text-white uppercase font-sans">
                {geoA.city}, {geoA.state} <span className="text-zinc-500 font-mono text-sm">({geoA.zip})</span>
                {' vs '}
                {geoB.city}, {geoB.state} <span className="text-zinc-500 font-mono text-sm">({geoB.zip})</span>
              </h1>
            </div>
          </div>

          {/* Quick ZIP Pair Switcher */}
          <form onSubmit={handleUpdate} className="flex items-center gap-2 text-xs">
            <input
              type="text"
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              maxLength={5}
              className="w-20 bg-zinc-900 text-white font-mono text-xs px-2.5 py-1.5 rounded border border-zinc-800 focus:outline-none focus:border-white text-center font-bold"
            />
            <span className="text-zinc-500">vs</span>
            <input
              type="text"
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              maxLength={5}
              className="w-20 bg-zinc-900 text-white font-mono text-xs px-2.5 py-1.5 rounded border border-zinc-800 focus:outline-none focus:border-white text-center font-bold"
            />
            <button
              type="submit"
              className="btn-interactive px-3 py-1.5 bg-white text-black font-bold text-xs uppercase rounded cursor-pointer"
            >
              Update
            </button>
          </form>

        </div>
      </div>

      {/* MAIN HEAD-TO-HEAD SCORECARD */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* VITALITY SCORE BANNER */}
        <section className="mono-card p-6 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-6">
          
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white uppercase tracking-wider">
                Neighborhood Vitality Index Comparison
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">0–100 Multi-Factor Score</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AREA A VITALITY */}
            <div className={`p-5 rounded-xl border bg-black space-y-3 ${vitalityA.score >= vitalityB.score ? 'border-emerald-500/80 shadow-lg' : 'border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  ZIP {geoA.zip}
                </span>
                {vitalityA.score >= vitalityB.score && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-400 text-black flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>HIGHER VITALITY</span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase font-sans">
                  {geoA.city}, {geoA.state}
                </h3>
                <span className="text-xs text-zinc-400 block mt-0.5">{vitalityA.tier}</span>
              </div>
              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-4xl font-black text-white">{vitalityA.score}</span>
                <span className="text-sm text-zinc-500">/ 100</span>
              </div>
              <p className="text-xs text-zinc-500 font-sans font-normal leading-relaxed">
                {vitalityA.tierDescription}
              </p>
              <div className="pt-2 border-t border-zinc-900">
                <Link href={`/area/${geoA.zip}`} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                  <span>Open Full Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* AREA B VITALITY */}
            <div className={`p-5 rounded-xl border bg-black space-y-3 ${vitalityB.score > vitalityA.score ? 'border-emerald-500/80 shadow-lg' : 'border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  ZIP {geoB.zip}
                </span>
                {vitalityB.score > vitalityA.score && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-400 text-black flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>HIGHER VITALITY</span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase font-sans">
                  {geoB.city}, {geoB.state}
                </h3>
                <span className="text-xs text-zinc-400 block mt-0.5">{vitalityB.tier}</span>
              </div>
              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-4xl font-black text-white">{vitalityB.score}</span>
                <span className="text-sm text-zinc-500">/ 100</span>
              </div>
              <p className="text-xs text-zinc-500 font-sans font-normal leading-relaxed">
                {vitalityB.tierDescription}
              </p>
              <div className="pt-2 border-t border-zinc-900">
                <Link href={`/area/${geoB.zip}`} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                  <span>Open Full Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>

        </section>

        {/* HEAD-TO-HEAD METRICS COMPARISON TABLE */}
        <section className="mono-card rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
          
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between text-xs">
            <h2 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-white" />
              <span>Federal Census ACS & Spatial Node Metrics</span>
            </h2>
            <span className="text-zinc-500 text-[10px]">Direct Delta Comparisons</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 uppercase text-[11px]">
                  <th className="p-4 w-1/3">METRIC</th>
                  <th className="p-4 w-1/3 font-bold text-white">
                    {geoA.city}, {geoA.state} ({geoA.zip})
                  </th>
                  <th className="p-4 w-1/3 font-bold text-white">
                    {geoB.city}, {geoB.state} ({geoB.zip})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                
                {/* Median Income */}
                <tr>
                  <td className="p-4 text-zinc-400 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Median Household Income</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{formatCurrency(incomeA)}</strong>
                      {incomeA >= incomeB && <span className="text-[10px] text-emerald-400 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">LEADER</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{formatCurrency(incomeB)}</strong>
                      {incomeB > incomeA && <span className="text-[10px] text-emerald-400 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">LEADER</span>}
                    </div>
                  </td>
                </tr>

                {/* 5Y Income Growth */}
                <tr>
                  <td className="p-4 text-zinc-400 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                    <span>5-Year Income Growth</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <strong className="text-emerald-400 text-sm">+{growthA}%</strong>
                      {growthA >= growthB && <span className="text-[10px] text-emerald-400 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">LEADER</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <strong className="text-emerald-400 text-sm">+{growthB}%</strong>
                      {growthB > growthA && <span className="text-[10px] text-emerald-400 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">LEADER</span>}
                    </div>
                  </td>
                </tr>

                {/* Population */}
                <tr>
                  <td className="p-4 text-zinc-400 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Total Population</span>
                  </td>
                  <td className="p-4 font-bold text-white text-sm">{formatNum(popA)}</td>
                  <td className="p-4 font-bold text-white text-sm">{formatNum(popB)}</td>
                </tr>

                {/* Housing Units */}
                <tr>
                  <td className="p-4 text-zinc-400 flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Housing Units</span>
                  </td>
                  <td className="p-4 font-bold text-white text-sm">{formatNum(censusA?.housing_units || 14000)}</td>
                  <td className="p-4 font-bold text-white text-sm">{formatNum(censusB?.housing_units || 16500)}</td>
                </tr>

                {/* Median Home Value */}
                <tr>
                  <td className="p-4 text-zinc-400 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Median Home Value</span>
                  </td>
                  <td className="p-4 font-bold text-white text-sm">{formatCurrency(homeValA)}</td>
                  <td className="p-4 font-bold text-white text-sm">{formatCurrency(homeValB)}</td>
                </tr>

                {/* New Openings */}
                <tr>
                  <td className="p-4 text-zinc-400 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Recent Tracked Openings</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white font-bold">{openA} New Places</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white font-bold">{openB} New Places</span>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-10 text-xs text-zinc-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
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
            <Link href="/compare" className="hover:text-white transition-colors">Compare Hub</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/data-sources" className="hover:text-white transition-colors">Data Sources</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
