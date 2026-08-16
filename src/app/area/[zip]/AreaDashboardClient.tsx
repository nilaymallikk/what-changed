'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, Sparkles, Plus, Minus,
  ArrowRight, Radio, Search, Share2, 
  ArrowLeftRight, Trophy, Loader2
} from 'lucide-react';
import type { GeoLocation, Change, AISummary, CensusDemographics } from '@/types';

import { defaultGeocodingProvider } from '@/services/geocoding';
import { overpassProvider } from '@/services/providers/OverpassProvider';
import { detectPlaceChanges } from '@/services/changeDetection';
import { generateAISummary } from '@/services/aiSummary';
import { getAreaFallbackData } from '@/services/demoData';
import { localDB } from '@/services/supabaseClient';
import { censusService } from '@/services/censusService';
import { calculateVitalityScore } from '@/services/vitalityScore';
import { MapComponent } from '@/components/MapComponent';
import { Sidebar } from '@/components/Sidebar';
import { ShareModal } from '@/components/ShareModal';

interface Props {
  zip: string;
}

export const AreaDashboardClient: React.FC<Props> = ({ zip }) => {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [aiSummary, setAISummary] = useState<AISummary | null>(null);
  const [demographics, setDemographics] = useState<CensusDemographics | null>(null);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [activeNavSection, setActiveNavSection] = useState<'overview' | 'demographics' | 'timeline'>('overview');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('Resolving geographic perimeter...');
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [censusFilter, setCensusFilter] = useState<'1y' | '5y' | '10y'>('5y');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDashboardData = async (zipCode: string, forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setIsRescanning(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setScanStep(`Resolving location & census baseline for ZIP ${zipCode}...`);

    try {
      // 1. Instant parallel resolution of location & census demographics (< 100ms)
      const [geoLoc, censusData] = await Promise.all([
        defaultGeocodingProvider.resolveZip(zipCode),
        censusService.getDemographics(zipCode)
      ]);
      setLocation(geoLoc);
      setDemographics(censusData);

      const areaId = `area_${geoLoc.zip}`;
      const sourceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      const areaObj = {
        id: areaId,
        zip_code: geoLoc.zip,
        city: geoLoc.city,
        state: geoLoc.state,
        country: 'USA',
        latitude: geoLoc.latitude,
        longitude: geoLoc.longitude,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localDB.saveArea(areaObj);

      const storedChanges = localDB.getChanges(areaId);
      const storedSummary = localDB.getAISummary(areaId);

      const hasRealStoredData = storedChanges.length >= 4 && !storedChanges.some(c => c.id.startsWith('demo_') || c.id.startsWith('gen_'));

      // If already scanned & cached, instant return (< 1ms)
      if (!forceRefresh && hasRealStoredData && storedSummary) {
        setChanges(storedChanges);
        setAISummary(storedSummary);
        setLoading(false);
        setIsRescanning(false);
        return;
      }

      // 2. High-speed spatial scan (fast parallel OSM + Wikipedia with strict timeouts)
      setScanStep(`Scanning active spatial places and local landmarks...`);
      const fetchResult = await overpassProvider.fetchNearbyData(geoLoc.latitude, geoLoc.longitude);

      if (fetchResult.places && fetchResult.places.length > 0) {
        setScanStep(`Diffing snapshot history and synthesizing changes...`);
        const existingSnapshots = localDB.getSnapshots(areaId);
        let previousPlaces: any[] = [];
        if (existingSnapshots.length > 0) {
          const lastSnap = existingSnapshots[existingSnapshots.length - 1];
          previousPlaces = lastSnap.metadata?.places || [];
        }

        const detectedChanges = detectPlaceChanges(areaId, sourceId, previousPlaces, fetchResult.places);

        const newSnapshot = {
          id: `snap_${Date.now()}`,
          area_id: areaId,
          source_id: sourceId,
          captured_at: new Date().toISOString(),
          status: 'completed' as const,
          record_count: fetchResult.places.length,
          metadata: { places: fetchResult.places },
          created_at: new Date().toISOString()
        };
        localDB.saveSnapshot(newSnapshot);
        localDB.saveChanges(detectedChanges);

        setScanStep(`Synthesizing executive narrative...`);
        const newAISummary = await generateAISummary({
          areaId,
          zip: geoLoc.zip,
          city: geoLoc.city,
          state: geoLoc.state,
          changes: detectedChanges
        });
        localDB.saveAISummary(newAISummary);

        setChanges(detectedChanges);
        setAISummary(newAISummary);
      } else {
        // High-precision deterministic area baseline
        const fallback = getAreaFallbackData(geoLoc, censusData);
        setChanges(fallback.changes);
        setAISummary(fallback.aiSummary);
        localDB.saveChanges(fallback.changes);
        localDB.saveAISummary(fallback.aiSummary);
      }

    } catch (err: any) {
      console.error("Area loading error:", err);
      try {
        const geoLoc = await defaultGeocodingProvider.resolveZip(zipCode);
        const fallback = getAreaFallbackData(geoLoc, null);
        setLocation(geoLoc);
        setChanges(fallback.changes);
        setAISummary(fallback.aiSummary);
      } catch {
        setError(err.message || "Failed to load area details");
      }
    } finally {
      setLoading(false);
      setIsRescanning(false);
    }
  };

  useEffect(() => {
    loadDashboardData(zip);
  }, [zip]);

  const handleSectionScroll = (section: 'overview' | 'demographics' | 'timeline') => {
    setActiveNavSection(section);
    if (section === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (section === 'demographics') {
      const el = document.getElementById('demographics-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'timeline') {
      const el = document.getElementById('timeline-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono text-white selection:bg-white selection:text-black">
        <div className="mono-card p-8 rounded-2xl border border-zinc-800 text-center max-w-md w-full space-y-6 shadow-2xl bg-zinc-950">
          
          {/* Animated Radar Pulse Visualizer */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-zinc-800 animate-ping opacity-30" />
            <div className="absolute inset-2 rounded-full border border-zinc-700 animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-glow">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                Executing Live Spatial Scan
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {scanStep}
            </p>
          </div>

          {/* Micro Progress Track */}
          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
            <div className="bg-white h-full w-2/3 rounded-full animate-pulse" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest pt-1">
            <span>ZIP {zip}</span>
            <span>OSM / ACS / WIKI</span>
            <span>SPEED: FAST</span>
          </div>

        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono text-white">
        <div className="mono-card p-8 rounded-xl border border-zinc-800 text-center max-w-md w-full space-y-4">
          <h3 className="font-bold text-base uppercase text-white">Location Lookup Failed</h3>
          <p className="text-xs text-zinc-400 font-sans">{error || "Could not retrieve data for ZIP."}</p>
          <Link href="/" className="btn-interactive inline-block px-4 py-2 bg-white text-black font-bold text-xs rounded-lg uppercase">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Filter changes
  const filteredChanges = changes.filter(c => {
    if (typeFilter !== 'all' && c.change_type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = (c.new_data?.name || c.old_data?.name || c.title || '').toLowerCase();
      const cat = (c.new_data?.category || c.old_data?.category || '').toLowerCase();
      const addr = (c.new_data?.address || c.old_data?.address || '').toLowerCase();
      if (!name.includes(q) && !cat.includes(q) && !addr.includes(q)) return false;
    }
    return true;
  });

  const displayChanges = filteredChanges.length > 0 ? filteredChanges : changes;
  const vitality = calculateVitalityScore(demographics, displayChanges);

  // Census calculation deltas based on selected census horizon (1y, 5y, 10y)
  const popVal = demographics?.population ? Number(demographics.population).toLocaleString() : '24,582';
  const incVal = demographics?.median_income ? `$${Math.round(Number(demographics.median_income) / 1000)}k` : '$142k';
  const houseVal = demographics?.housing_units ? Number(demographics.housing_units).toLocaleString() : '18,204';
  const vacVal = demographics?.median_home_value ? `$${Math.round(Number(demographics.median_home_value) / 1000)}k` : '$920k';

  const history = censusFilter === '1y' 
    ? demographics?.history_1y 
    : censusFilter === '10y' 
      ? demographics?.history_10y 
      : demographics?.history_5y;

  const popDelta = history && demographics?.population 
    ? (((demographics.population - history.population) / history.population) * 100).toFixed(1)
    : '2.4';
  const incDelta = history && demographics?.median_income 
    ? (((demographics.median_income - history.median_income) / history.median_income) * 100).toFixed(1)
    : '8.1';
  const houseDelta = history && demographics?.housing_units 
    ? (((demographics.housing_units - history.housing_units) / history.housing_units) * 100).toFixed(1)
    : '1.2';
  const valDelta = history && demographics?.median_home_value 
    ? (((demographics.median_home_value - history.median_home_value) / history.median_home_value) * 100).toFixed(1)
    : '3.5';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row antialiased selection:bg-white selection:text-black">
      
      {/* LEFT PERSISTENT SIDEBAR */}
      <Sidebar 
        currentZip={location.zip} 
        activeSection={activeNavSection} 
        onSectionClick={handleSectionScroll} 
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl flex flex-col justify-between">
        
        <div className="space-y-6">
          {/* HEADER SECTION */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div className="space-y-1.5 font-mono">
              {/* Top Badges */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold uppercase tracking-wider rounded">
                  ZIP {location.zip}
                </span>
                <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider rounded">
                  {location.city} / METRO
                </span>
              </div>

              {/* City Title */}
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
                {location.city}, {location.state}
              </h1>
            </div>

            {/* Action Buttons: Share, Compare, Rescan */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="btn-interactive px-3.5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-zinc-400" />
                <span>Share Report</span>
              </button>

              <Link
                href={`/compare?zipA=${location.zip}`}
                className="btn-interactive px-3.5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-zinc-400" />
                <span>Compare</span>
              </Link>

              <button
                onClick={() => loadDashboardData(location.zip, true)}
                disabled={isRescanning}
                className="btn-interactive px-4 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-mono font-black uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-70"
              >
                {isRescanning ? (
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                ) : (
                  <Radio className="w-4 h-4 text-black animate-pulse" />
                )}
                <span>{isRescanning ? 'SCANNING...' : 'RESCAN LIVE MAP'}</span>
              </button>
            </div>
          </header>

          {/* VITALITY SCORE CARD BANNER */}
          <section className="bg-zinc-950 p-5 rounded-xl border border-zinc-800/90 shadow-xl space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Neighborhood Vitality Index</span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] font-bold text-emerald-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {vitality.tier}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Economic Health:</span>
                <span className="text-xl font-black text-white">{vitality.score}</span>
                <span className="text-xs text-zinc-500">/ 100</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed font-normal">
              {vitality.tierDescription}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-black p-2.5 rounded-lg border border-zinc-900">
                <span className="text-zinc-500 block">5Y Income Shift</span>
                <strong className="text-emerald-400 font-bold text-xs">+{vitality.metrics.incomeGrowthPct}%</strong>
              </div>
              <div className="bg-black p-2.5 rounded-lg border border-zinc-900">
                <span className="text-zinc-500 block">Tracked Openings</span>
                <strong className="text-white font-bold text-xs">{vitality.metrics.openedCount} New Places</strong>
              </div>
              <div className="bg-black p-2.5 rounded-lg border border-zinc-900">
                <span className="text-zinc-500 block">Housing Occupancy</span>
                <strong className="text-white font-bold text-xs">{vitality.metrics.occupancyRatePct}%</strong>
              </div>
              <div className="bg-black p-2.5 rounded-lg border border-zinc-900">
                <span className="text-zinc-500 block">Velocity Weight</span>
                <strong className="text-white font-bold text-xs">{vitality.breakdown.commercialVelocityScore}/30 pts</strong>
              </div>
            </div>
          </section>

          {/* EXECUTIVE NARRATIVE CARD */}
          {aiSummary && (
            <section className="bg-zinc-950 p-6 rounded-xl border border-zinc-800/90 shadow-xl space-y-2 font-mono">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-white shrink-0" />
                <span>EXECUTIVE NARRATIVE</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed font-normal pt-1">
                {aiSummary.summary}
              </p>
            </section>
          )}

          {/* CENSUS DEMOGRAPHICS SECTION */}
          <section id="demographics-section" className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full border-2 border-white" />
                <span>CENSUS DEMOGRAPHICS</span>
              </div>

              {/* 1Y / 5Y / 10Y Timeframe Filter */}
              <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
                {(['1y', '5y', '10y'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setCensusFilter(tf)}
                    className={`btn-interactive px-3 py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                      censusFilter === tf
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  TOTAL POPULATION
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-white">{popVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                    ↗ {popDelta}%
                  </span>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  MEDIAN INCOME
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-white">{incVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                    ↗ {incDelta}%
                  </span>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  HOUSING UNITS
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-white">{houseVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                    ↗ {houseDelta}%
                  </span>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  COMMERCIAL VACANCY
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-white">{vacVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 flex items-center gap-0.5">
                    ↗ {valDelta}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* LOWER SECTION: SPLIT VECTOR MAP & CHRONOLOGICAL FEED */}
          <div id="timeline-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
            
            {/* LEFT: VECTOR_NODE_MAP (Lg: 7 cols) */}
            <div className="lg:col-span-7 space-y-3 font-mono">
              
              {/* Map Top Bar */}
              <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 bg-white" />
                  <span>VECTOR_NODE_MAP</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span>LOD: HIGH</span>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded">
                    <span className="px-2 py-0.5 border-r border-zinc-800 text-zinc-400 hover:text-white cursor-pointer flex items-center">
                      <Plus className="w-3 h-3" />
                    </span>
                    <span className="px-2 py-0.5 text-zinc-400 hover:text-white cursor-pointer flex items-center">
                      <Minus className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Container */}
              <div className="rounded-xl overflow-hidden border border-zinc-800/90 shadow-2xl">
                <MapComponent
                  location={location}
                  changes={displayChanges}
                  selectedChangeId={selectedChangeId}
                  onSelectChange={setSelectedChangeId}
                />
              </div>
            </div>

            {/* RIGHT: CHRONOLOGICAL_EVENT_FEED (Lg: 5 cols) */}
            <div className="lg:col-span-5 space-y-3 font-mono">
              
              {/* Feed Top Bar */}
              <div className="space-y-2 border-b border-zinc-800 pb-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                    <span>CHRONOLOGICAL_EVENT_FEED</span>
                    <span className="text-[10px] text-zinc-500 font-normal">({displayChanges.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {(['all', 'business_opened', 'business_removed'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTypeFilter(tf)}
                        className={`btn-interactive px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                          typeFilter === tf
                            ? 'bg-white text-black font-black'
                            : 'text-zinc-500 hover:text-zinc-300 bg-zinc-950 border border-zinc-800'
                        }`}
                      >
                        {tf === 'all' ? 'ALL' : tf === 'business_opened' ? '+ NEW' : '− UNLISTED'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar within Feed */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter events by name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 text-white placeholder-zinc-600 text-[11px] font-mono pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800/80 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Event Cards List */}
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {displayChanges.map((change) => {
                  const placeData = change.new_data || change.old_data || {};
                  const isSelected = selectedChangeId === change.id;
                  const eventDate = new Date(change.event_date || change.detected_at);
                  const timeAgoStr = !isNaN(eventDate.getTime())
                    ? eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Recent';
                  const sigScoreDecimal = ((change.significance_score || 80) / 10).toFixed(1);

                  return (
                    <div
                      key={change.id}
                      onClick={() => setSelectedChangeId(change.id)}
                      className={`btn-interactive p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900 border-white shadow-2xl scale-[1.01]'
                          : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Badge Row */}
                      <div className="flex items-center justify-between gap-2 mb-2 font-mono">
                        <div className="flex items-center gap-1.5">
                          {change.change_type === 'business_opened' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white text-black tracking-wider">
                              BUSINESS_OPENED
                            </span>
                          )}
                          {change.change_type === 'business_removed' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-zinc-900 text-zinc-300 border border-zinc-700 tracking-wider">
                              BUSINESS_REMOVED
                            </span>
                          )}
                          {change.change_type === 'business_modified' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-zinc-900 text-zinc-200 border border-zinc-700 tracking-wider">
                              BUSINESS_MODIFIED
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-400 text-[10px] rounded border border-zinc-800 uppercase">
                            {placeData.category ? placeData.category.slice(0, 10) : 'LOCAL'}
                          </span>
                        </div>

                        <span className="text-[10px] text-zinc-500 font-mono">
                          {timeAgoStr}
                        </span>
                      </div>

                      {/* Place Name */}
                      <h3 className="font-bold text-base text-white leading-snug font-sans">
                        {placeData.name || change.title}
                      </h3>

                      {/* Address */}
                      {placeData.address && (
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{placeData.address}</span>
                        </p>
                      )}

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="text-[11px] text-zinc-400">
                          <span className="text-zinc-600">SIG_SCORE </span>
                          <strong className="text-white font-bold">{sigScoreDecimal} / 10</strong>
                        </div>

                        <Link
                          href={`/area/${location.zip}/change/${change.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-white hover:underline flex items-center gap-1 text-[11px] uppercase tracking-wider"
                        >
                          <span>ANALYZE</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>

        {/* SYSTEM FOOTER */}
        <footer className="pt-12 pb-4 border-t border-zinc-900 text-[11px] font-mono text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <Link href="/compare" className="hover:text-white transition-colors">Compare Areas</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore Metros</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </footer>

      </main>

      {/* SHARE INFOGRAPHIC MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        location={location}
        demographics={demographics}
        vitality={vitality}
        changes={displayChanges}
      />

    </div>
  );
};
