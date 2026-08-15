import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Zap, Calendar, MapPin, AlertCircle, Info, 
  ChevronRight, ShieldAlert, Filter
} from 'lucide-react';
import type { GeoLocation, Change, AISummary } from '../types';

import { defaultGeocodingProvider } from '../services/geocoding';
import { overpassProvider } from '../services/providers/OverpassProvider';
import { detectPlaceChanges } from '../services/changeDetection';
import { generateAISummary } from '../services/aiSummary';
import { getDemoData } from '../services/demoData';
import { localDB } from '../services/supabaseClient';
import { MapComponent } from '../components/MapComponent';

type DateFilter = '7d' | '30d' | '3m' | '6m' | '1y';

export const AreaDashboard: React.FC = () => {
  const { zip = '90210' } = useParams<{ zip: string }>();

  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [aiSummary, setAISummary] = useState<AISummary | null>(null);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Resolving location & area data...');
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDashboardData = async (zipCode: string) => {
    setLoading(true);
    setError(null);
    setLoadingMessage(`Resolving location & area data for ZIP ${zipCode}...`);

    try {
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

      let storedChanges = localDB.getChanges(areaId);
      let storedSummary = localDB.getAISummary(areaId);

      const demoDataset = getDemoData(geoLoc.zip);

      if (storedChanges.length > 0) {
        setChanges(storedChanges);
        setAISummary(storedSummary);
        setIsDemo(storedChanges.some(c => c.is_demo));
        setLoading(false);
        return;
      }

      if (demoDataset) {
        setChanges(demoDataset.changes);
        setAISummary(demoDataset.aiSummary);
        setIsDemo(true);
        localDB.saveChanges(demoDataset.changes);
        localDB.saveAISummary(demoDataset.aiSummary);
        setLoading(false);
        return;
      }

      setLoadingMessage("Fetching live OpenStreetMap data...");
      const fetchResult = await overpassProvider.fetchNearbyData(geoLoc.latitude, geoLoc.longitude);

      setLoadingMessage("Comparing snapshot data and detecting changes...");
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

      setLoadingMessage("Writing neighborhood update with AI...");
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
      setIsDemo(false);

    } catch (err: any) {
      console.error("Area loading error:", err);
      setError(err.message || "Failed to load area details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(zip);
  }, [zip]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="mono-card p-8 rounded-xl border border-zinc-800 text-center max-w-sm w-full space-y-4 shadow-2xl">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="font-extrabold text-white text-sm mb-1 uppercase tracking-wider">Analyzing Area</h3>
            <p className="text-zinc-500 text-xs font-mono">{loadingMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !location) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="mono-card p-8 rounded-xl border border-zinc-800 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-white mx-auto" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">ZIP Code Not Found</h2>
          <p className="text-xs text-zinc-400 font-mono">{error}</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!location) return null;

  const filteredChanges = changes.filter(change => {
    if (typeFilter !== 'all' && change.change_type !== typeFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const nameMatch = change.title.toLowerCase().includes(q) || change.description.toLowerCase().includes(q);
      const catMatch = (change.new_data?.category || change.old_data?.category || '').toLowerCase().includes(q);
      if (!nameMatch && !catMatch) return false;
    }

    const now = Date.now();
    const changeTime = new Date(change.detected_at).getTime();
    const daysDiff = (now - changeTime) / (1000 * 3600 * 24);

    if (dateFilter === '7d' && daysDiff > 7) return false;
    if (dateFilter === '30d' && daysDiff > 30) return false;
    if (dateFilter === '3m' && daysDiff > 90) return false;
    if (dateFilter === '6m' && daysDiff > 180) return false;
    if (dateFilter === '1y' && daysDiff > 365) return false;

    return true;
  });

  const countNew = filteredChanges.filter(c => c.change_type === 'business_opened').length;
  const countRemoved = filteredChanges.filter(c => c.change_type === 'business_removed').length;
  const countModified = filteredChanges.filter(c => c.change_type === 'business_modified').length;

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      
      {/* Sub-Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mb-1">
              <Link to="/" className="hover:text-white">Home</Link>
              <ChevronRight className="w-3 h-3 text-zinc-700" />
              <span>Area Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 uppercase">
              What Changed Around <span className="text-zinc-400">{location.zip}</span>
            </h1>
            <p className="text-xs font-mono text-zinc-400 flex items-center gap-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span>{location.city}, {location.state}</span>
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-500">
                Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">

        {/* AI SUMMARY BANNER (Mono High Contrast Card) */}
        {aiSummary && (
          <div className="mono-card p-6 sm:p-7 rounded-xl border border-zinc-700 relative overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 fill-white text-black" />
              <span>Executive AI Summary</span>
              <span className="text-zinc-500 font-normal text-[10px]">({aiSummary.model})</span>
            </div>

            {aiSummary.headline && (
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
                "{aiSummary.headline}"
              </h2>
            )}

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-4xl font-normal">
              {aiSummary.summary}
            </p>

            {/* HIGHLIGHTED CHANGES */}
            {aiSummary.highlights && aiSummary.highlights.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Top Significance Events
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {aiSummary.highlights.map((h, idx) => (
                    <div key={idx} className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{idx + 1}. {h.title}</span>
                        <span className="text-[10px] font-mono bg-white text-black px-1.5 py-0.5 rounded font-black">
                          {h.importance} pts
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-normal">{h.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FILTERS BAR */}
        <div className="mono-card p-3.5 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Stat Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 font-mono text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
                typeFilter === 'all' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              ALL ({filteredChanges.length})
            </button>
            <button
              onClick={() => setTypeFilter('business_opened')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
                typeFilter === 'business_opened' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              + NEW ({countNew})
            </button>
            <button
              onClick={() => setTypeFilter('business_removed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
                typeFilter === 'business_removed' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              − UNLISTED ({countRemoved})
            </button>
            <button
              onClick={() => setTypeFilter('business_modified')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
                typeFilter === 'business_modified' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              Δ MODIFIED ({countModified})
            </button>
          </div>

          {/* Date Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg shrink-0 border border-zinc-800 font-mono text-xs">
            {(['7d', '30d', '3m', '6m', '1y'] as DateFilter[]).map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1 rounded font-semibold capitalize transition-all ${
                  dateFilter === df ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {df === '7d' ? '7D' : df === '30d' ? '30D' : df === '3m' ? '3M' : df === '6m' ? '6M' : '1Y'}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* MAP & TIMELINE COLUMN (Lg: 7 cols) */}
          <div className="lg:col-span-7 lg:sticky lg:top-20 space-y-4">
            
            {/* Map */}
            <MapComponent
              location={location}
              changes={filteredChanges}
              selectedChangeId={selectedChangeId}
              onSelectChange={setSelectedChangeId}
            />

            {/* TIMELINE */}
            <div className="mono-card p-5 rounded-xl border border-zinc-800 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white" />
                <span>Chronological Timeline</span>
              </h3>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-zinc-800">
                {filteredChanges.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2 font-mono">No changes found for selected filters.</p>
                ) : (
                  filteredChanges.map(c => {
                    const dateStr = new Date(c.detected_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const isSelected = selectedChangeId === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedChangeId(c.id)}
                        className={`relative pl-8 cursor-pointer group transition-all ${
                          isSelected ? 'scale-[1.01]' : ''
                        }`}
                      >
                        <div className="absolute left-1.5 top-2 w-3 h-3 rounded-full border-2 border-white bg-black shadow" />

                        <div className={`p-3 rounded-lg border text-xs transition-all ${
                          isSelected ? 'bg-zinc-900 border-white shadow-lg' : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800'
                        }`}>
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
                            <span>{dateStr}</span>
                            <span className="uppercase font-bold tracking-wider text-white">{c.change_type.replace('business_', '')}</span>
                          </div>
                          <p className="font-bold text-white group-hover:text-zinc-300">{c.title}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* CHANGE CARDS LIST COLUMN (Lg: 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search Filter Input */}
            <div className="mono-card p-3 rounded-xl border border-zinc-800">
              <div className="relative">
                <Filter className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by business name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black text-white text-xs pl-9 pr-4 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>

            {/* CHANGE CARDS */}
            <div className="space-y-3">
              {filteredChanges.length === 0 ? (
                <div className="mono-card p-8 rounded-xl border border-zinc-800 text-center space-y-2">
                  <Info className="w-8 h-8 text-zinc-500 mx-auto" />
                  <p className="text-sm font-bold text-zinc-300 uppercase tracking-wider">No changes detected</p>
                  <p className="text-xs text-zinc-500 font-mono">Try adjusting your date filters.</p>
                </div>
              ) : (
                filteredChanges.map(change => {
                  const placeData = change.new_data || change.old_data || {};
                  const isSelected = selectedChangeId === change.id;
                  const dateStr = new Date(change.detected_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  const confidencePct = Math.round((change.confidence || 0.9) * 100);

                  return (
                    <div
                      key={change.id}
                      onClick={() => setSelectedChangeId(change.id)}
                      className={`mono-card p-5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-white bg-zinc-900 shadow-xl'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Badge Header */}
                      <div className="flex items-center justify-between gap-2 mb-2 font-mono">
                        {change.change_type === 'business_opened' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white text-black tracking-wider">
                            + NEW PLACE
                          </span>
                        )}
                        {change.change_type === 'business_removed' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 tracking-wider">
                            − UNLISTED
                          </span>
                        )}
                        {change.change_type === 'business_modified' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-200 border border-zinc-600 tracking-wider">
                            Δ MODIFIED
                          </span>
                        )}

                        <span className="text-[11px] text-zinc-400">
                          {confidencePct}% match
                        </span>
                      </div>

                      {/* Title & Category */}
                      <h3 className="font-bold text-base text-white leading-snug">
                        {placeData.name || change.title}
                      </h3>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        {placeData.category || 'Business'}
                      </p>

                      {/* Address */}
                      {placeData.address && (
                        <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{placeData.address}</span>
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-xs text-zinc-300 mt-2 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                        {change.description}
                      </p>

                      {/* Disclaimer for Removed places */}
                      {change.change_type === 'business_removed' && (
                        <div className="mt-3 bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed font-mono">
                          <ShieldAlert className="w-4 h-4 text-white shrink-0 mt-0.5" />
                          <p>
                            <strong>Disclaimer:</strong> Indicates entity absence in the latest OpenStreetMap snapshot.
                          </p>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                        <span>{dateStr}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-600">OpenStreetMap</span>
                          <Link
                            to={`/area/${location.zip}/change/${change.id}`}
                            className="font-bold text-white hover:underline flex items-center gap-0.5"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* TRANSPARENCY CALLOUT */}
            <div className="mono-card p-4 rounded-xl border border-zinc-800 space-y-1.5 mt-6 font-mono text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-white" />
                <span>How We Know</span>
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                Changes are calculated by matching entity geographic nodes and OSM tag attributes between historical point-in-time snapshots.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
