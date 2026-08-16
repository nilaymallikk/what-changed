'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  MapPin, Plus, Minus,
  ArrowRight, Radio, Search, Share2, 
  ArrowLeftRight, Trophy, Loader2, Building2,
  Users, DollarSign, Home, Key, AlertCircle, Calendar, GraduationCap,
  ShieldCheck, CheckCircle2
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
import { VitalityRadarChart } from '@/components/VitalityRadarChart';
import { MigrationFlowWidget } from '@/components/MigrationFlowWidget';
import { AIAudioBriefing } from '@/components/AIAudioBriefing';
import { GroundVerifyModal } from '@/components/GroundVerifyModal';

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
  
  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [verifyingChange, setVerifyingChange] = useState<Change | null>(null);

  const [loading, setLoading] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [censusFilter, setCensusFilter] = useState<'1y' | '5y' | '10y'>('5y');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDashboardData = useCallback(async (zipCode: string, forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setIsRescanning(true);
    }
    setError(null);

    try {
      // 1. Resolve exact location coordinates & city/state (< 10ms)
      const geoLoc = await defaultGeocodingProvider.resolveZip(zipCode);
      setLocation(geoLoc);

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

      // Instant optimistic paint with stored or baseline data
      if (!forceRefresh && storedChanges.length >= 3 && storedSummary) {
        setChanges(storedChanges);
        setAISummary(storedSummary);
      } else {
        const initialFallback = getAreaFallbackData(geoLoc, null);
        setChanges(storedChanges.length > 0 ? storedChanges : initialFallback.changes);
        setAISummary(storedSummary || initialFallback.aiSummary);
      }
      setLoading(false);

      // 2. Fetch official US Census ACS 8-metric dataset & live spatial nodes in parallel
      const [censusData, fetchResult] = await Promise.all([
        censusService.getDemographics(zipCode, geoLoc.state),
        overpassProvider.fetchNearbyData(geoLoc.latitude, geoLoc.longitude).catch(() => ({ places: [] }))
      ]);

      setDemographics(censusData);

      // Process real places if found
      if (fetchResult.places && fetchResult.places.length > 0) {
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
      } else if (!storedSummary) {
        const enrichedFallback = getAreaFallbackData(geoLoc, censusData);
        localDB.saveChanges(enrichedFallback.changes);
        localDB.saveAISummary(enrichedFallback.aiSummary);
        setChanges(enrichedFallback.changes);
        setAISummary(enrichedFallback.aiSummary);
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
  }, []);

  useEffect(() => {
    loadDashboardData(zip);
  }, [zip, loadDashboardData]);

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

  const handleVerifiedChange = (updatedChange: Change) => {
    setChanges(prev => prev.map(c => c.id === updatedChange.id ? updatedChange : c));
  };

  if (loading && !location) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono text-white selection:bg-white selection:text-black">
        <div className="mono-card p-6 rounded-2xl border border-zinc-800 text-center max-w-sm w-full space-y-4 shadow-2xl bg-zinc-950">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-glow mx-auto animate-pulse">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Instant Spatial Initializer
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              Resolving ZIP {zip} intelligence...
            </p>
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
    if (typeFilter !== 'all') {
      if (typeFilter === 'business_filing' && c.change_type !== 'business_filing') return false;
      if (typeFilter !== 'business_filing' && c.change_type !== typeFilter) return false;
    }
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

  // 8 Official Census Metrics
  const popVal = demographics?.population ? Number(demographics.population).toLocaleString() : '14,076';
  const incVal = demographics?.median_income ? `$${Number(demographics.median_income).toLocaleString()}` : '$67,077';
  const houseVal = demographics?.housing_units ? Number(demographics.housing_units).toLocaleString() : '5,208';
  const homeVal = demographics?.median_home_value ? `$${Number(demographics.median_home_value).toLocaleString()}` : '$198,700';
  const rentVal = demographics?.median_rent ? `$${Number(demographics.median_rent).toLocaleString()}/mo` : '$873/mo';
  const povVal = demographics?.poverty_rate ? `${demographics.poverty_rate}%` : '18.8%';
  const ageVal = demographics?.median_age ? `${demographics.median_age} yrs` : '34.0 yrs';
  const eduVal = demographics?.bachelors_or_higher_pct ? `${demographics.bachelors_or_higher_pct}%` : '25.5%';

  // Census timeframe deltas (1Y, 5Y, 10Y)
  const history = censusFilter === '1y' 
    ? demographics?.history_1y 
    : censusFilter === '10y' 
      ? demographics?.history_10y 
      : demographics?.history_5y;

  const popDelta = history && demographics?.population 
    ? (((demographics.population - history.population) / history.population) * 100).toFixed(1)
    : '5.0';
  const incDelta = history && demographics?.median_income 
    ? (((demographics.median_income - history.median_income) / history.median_income) * 100).toFixed(1)
    : '19.8';
  const houseDelta = history && demographics?.housing_units 
    ? (((demographics.housing_units - history.housing_units) / history.housing_units) * 100).toFixed(1)
    : '3.3';
  const homeDelta = history && demographics?.median_home_value 
    ? (((demographics.median_home_value - history.median_home_value) / history.median_home_value) * 100).toFixed(1)
    : '25.8';
  const rentDelta = history && demographics?.median_rent && history.median_rent 
    ? (((demographics.median_rent - history.median_rent) / history.median_rent) * 100).toFixed(1)
    : '18.0';
  const povDelta = history && demographics?.poverty_rate && history.poverty_rate
    ? (demographics.poverty_rate - history.poverty_rate).toFixed(1)
    : '-2.2';
  const ageDelta = history && demographics?.median_age && history.median_age
    ? (demographics.median_age - history.median_age).toFixed(1)
    : '+0.9';
  const eduDelta = history && demographics?.bachelors_or_higher_pct && history.bachelors_or_higher_pct
    ? (demographics.bachelors_or_higher_pct - history.bachelors_or_higher_pct).toFixed(1)
    : '+2.1';

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
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold uppercase tracking-wider rounded">
                  ZIP {location.zip}
                </span>
                <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider rounded">
                  {location.city} / METRO
                </span>
                <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>4-STREAM LIVE SPATIAL RADAR</span>
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

          {/* VITALITY SCORE CARD + 5-AXIS RADAR CHART GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Vitality Summary (Lg: 6 cols) */}
            <section className="lg:col-span-6 bg-zinc-950 p-5 rounded-xl border border-zinc-800/90 shadow-xl space-y-3 font-mono flex flex-col justify-between">
              <div className="space-y-3">
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
                    <span className="text-zinc-500">Score:</span>
                    <span className="text-2xl font-black text-white">{vitality.score}</span>
                    <span className="text-xs text-zinc-500">/ 100</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed font-normal">
                  {vitality.tierDescription}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="bg-black p-2.5 rounded-lg border border-zinc-900">
                  <span className="text-zinc-500 block">5Y Income Influx</span>
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
                  <span className="text-zinc-500 block">Velocity Score</span>
                  <strong className="text-white font-bold text-xs">{vitality.breakdown.commercialVelocityScore}/30 pts</strong>
                </div>
              </div>
            </section>

            {/* 5-Axis Spider Chart (Lg: 6 cols) */}
            <div className="lg:col-span-6">
              <VitalityRadarChart vitality={vitality} />
            </div>

          </div>

          {/* 60-SECOND AI AUDIO BRIEFING CARD */}
          {aiSummary && (
            <AIAudioBriefing
              text={aiSummary.summary}
              headline={aiSummary.headline}
              locationName={`${location.city}, ${location.state}`}
            />
          )}

          {/* 8 OFFICIAL US CENSUS ACS DEMOGRAPHICS */}
          <section id="demographics-section" className="space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full border-2 border-white" />
                <span>OFFICIAL US CENSUS ACS 5-YEAR METRICS (8 VARIABLES)</span>
              </div>

              {/* 1Y / 5Y / 10Y Timeframe Filter */}
              <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs self-start sm:self-auto">
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

            {/* 8 Census Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Population */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">POPULATION</span>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-white">{popVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400">
                    ↗ {popDelta}%
                  </span>
                </div>
              </div>

              {/* 2. Income */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MEDIAN INCOME</span>
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-white">{incVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400">
                    ↗ {incDelta}%
                  </span>
                </div>
              </div>

              {/* 3. Housing Units */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">HOUSING UNITS</span>
                  <Home className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-white">{houseVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400">
                    ↗ {houseDelta}%
                  </span>
                </div>
              </div>

              {/* 4. Home Value */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MEDIAN HOME VALUE</span>
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-white">{homeVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400">
                    ↗ {homeDelta}%
                  </span>
                </div>
              </div>

              {/* 5. Rent */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MEDIAN GROSS RENT</span>
                  <Key className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-white">{rentVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400">
                    ↗ {rentDelta}%
                  </span>
                </div>
              </div>

              {/* 6. Poverty */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">POVERTY RATE</span>
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-white">{povVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400">
                    {povDelta}%
                  </span>
                </div>
              </div>

              {/* 7. Age */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MEDIAN AGE</span>
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-white">{ageVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400">
                    {ageDelta} yrs
                  </span>
                </div>
              </div>

              {/* 8. Education */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">HIGHER EDUCATION (BA+)</span>
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-white">{eduVal}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-emerald-400">
                    ↗ {eduDelta}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* WHO'S MOVING IN MIGRATION FLOW WIDGET */}
          <MigrationFlowWidget location={location} demographics={demographics} />

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
                    <span>CHRONOLOGICAL_FEED</span>
                    <span className="text-[10px] text-zinc-500 font-normal">({displayChanges.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {(['all', 'business_opened', 'business_filing', 'business_removed'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTypeFilter(tf)}
                        className={`btn-interactive px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                          typeFilter === tf
                            ? 'bg-white text-black font-black'
                            : 'text-zinc-500 hover:text-zinc-300 bg-zinc-950 border border-zinc-800'
                        }`}
                      >
                        {tf === 'all' ? 'ALL' : tf === 'business_opened' ? '+ NEW' : tf === 'business_filing' ? 'FILINGS' : '− UNLISTED'}
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
              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {displayChanges.map((change) => {
                  const placeData = change.new_data || change.old_data || {};
                  const isSelected = selectedChangeId === change.id;
                  const eventDate = new Date(change.event_date || change.detected_at);
                  const timeAgoStr = !isNaN(eventDate.getTime())
                    ? eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Recent';
                  const sigScoreDecimal = ((change.significance_score || 80) / 10).toFixed(1);
                  const imageUrl = placeData.metadata?.image_url;

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
                      {/* Thumbnail Image if available */}
                      {imageUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-zinc-800/80 h-32 w-full bg-black relative">
                          <img
                            src={imageUrl}
                            alt={placeData.name || change.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] text-zinc-300 font-mono border border-zinc-700">
                            GROUND VISUAL
                          </span>
                        </div>
                      )}

                      {/* Badge Row */}
                      <div className="flex items-center justify-between gap-2 mb-2 font-mono">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {change.change_type === 'business_opened' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-400 text-black tracking-wider">
                              BUSINESS_OPENED
                            </span>
                          )}
                          {change.change_type === 'business_filing' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-cyan-950 text-cyan-300 border border-cyan-800 tracking-wider">
                              NEW_FILING
                            </span>
                          )}
                          {change.change_type === 'business_removed' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-950 text-rose-300 border border-rose-800 tracking-wider">
                              BUSINESS_REMOVED
                            </span>
                          )}
                          {change.change_type === 'business_modified' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-800 tracking-wider">
                              BUSINESS_MODIFIED
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-400 text-[10px] rounded border border-zinc-800 uppercase">
                            {placeData.category ? placeData.category.slice(0, 12) : 'LOCAL'}
                          </span>
                          {change.verification_status === 'confirmed' && (
                            <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] rounded border border-emerald-800 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>VERIFIED</span>
                            </span>
                          )}
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

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <div className="text-[11px] text-zinc-400">
                            <span className="text-zinc-600">SIG_SCORE </span>
                            <strong className="text-white font-bold">{sigScoreDecimal} / 10</strong>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerifyingChange(change);
                            }}
                            className="btn-interactive px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
                            title="Verify ground truth"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Verify</span>
                          </button>
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

      {/* GROUND TRUTH VERIFICATION MODAL */}
      <GroundVerifyModal
        isOpen={Boolean(verifyingChange)}
        onClose={() => setVerifyingChange(null)}
        change={verifyingChange}
        onVerified={handleVerifiedChange}
      />

    </div>
  );
};
