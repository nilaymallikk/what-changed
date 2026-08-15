import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, ExternalLink, ShieldAlert, 
  Layers
} from 'lucide-react';
import type { Change, GeoLocation } from '../types';

import { localDB } from '../services/supabaseClient';
import { getDemoData } from '../services/demoData';
import { MapComponent } from '../components/MapComponent';

export const ChangeDetailPage: React.FC = () => {
  const { zip = '90210', id } = useParams<{ zip: string; id: string }>();
  const [change, setChange] = useState<Change | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);

  useEffect(() => {
    const areaId = `area_${zip}`;
    const storedChanges = localDB.getChanges(areaId);
    let found: Change | undefined = storedChanges.find(c => c.id === id);

    if (!found) {
      const demo = getDemoData(zip);
      if (demo) {
        found = demo.changes.find(c => c.id === id);
      }
    }

    if (found) {
      setChange(found);
      const placeData = found.new_data || found.old_data;
      if (placeData) {
        setLocation({
          zip,
          city: placeData.city || 'Beverly Hills',
          state: placeData.state || 'CA',
          latitude: placeData.latitude || 34.0736,
          longitude: placeData.longitude || -118.4004
        });
      }
    }
  }, [zip, id]);

  if (!change) {
    return (
      <div className="min-h-screen bg-black p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Change record not found</h2>
        <Link to={`/area/${zip}`} className="text-white font-mono text-sm underline">
          ← Back to Area Dashboard
        </Link>
      </div>
    );
  }

  const placeData = change.new_data || change.old_data || {};
  const dateStr = new Date(change.event_date || change.detected_at).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const confidencePct = Math.round((change.confidence || 0.9) * 100);

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      
      {/* Top Nav */}
      <div className="border-b border-zinc-800 bg-zinc-950 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to={`/area/${zip}`}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard ({zip})</span>
          </Link>
          <span className="text-xs font-mono text-zinc-500">ID: {change.id}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Change Main Card */}
        <div className="mono-card rounded-xl p-6 sm:p-8 border border-zinc-800 shadow-2xl space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4 font-mono">
            <div className="flex items-center gap-2">
              {change.change_type === 'business_opened' && (
                <span className="px-3 py-1 rounded text-xs font-extrabold uppercase bg-white text-black">
                  + NEW PLACE
                </span>
              )}
              {change.change_type === 'business_removed' && (
                <span className="px-3 py-1 rounded text-xs font-extrabold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                  − UNLISTED
                </span>
              )}
              {change.change_type === 'business_modified' && (
                <span className="px-3 py-1 rounded text-xs font-extrabold uppercase bg-zinc-800 text-zinc-200 border border-zinc-600">
                  Δ MODIFIED DETAILS
                </span>
              )}

              <span className="px-2.5 py-1 bg-zinc-900 text-zinc-400 text-xs font-semibold rounded border border-zinc-800">
                Status: {change.verification_status}
              </span>
            </div>

            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>Detected {dateStr}</span>
            </div>
          </div>

          {/* Title & Category */}
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">{placeData.name || change.title}</h1>
            <p className="text-sm font-mono text-zinc-400 mt-1">{placeData.category || 'Business Category'}</p>
            
            {placeData.address && (
              <div className="mt-3 inline-flex items-center gap-2 bg-zinc-950 px-3.5 py-1.5 rounded-lg border border-zinc-700 text-xs font-mono font-bold text-white shadow-sm">
                <MapPin className="w-4 h-4 text-white shrink-0" />
                <span>{placeData.address}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-300 leading-relaxed font-normal">
            {change.description}
          </div>

          {/* Disclaimer for Removed Places */}
          {change.change_type === 'business_removed' && (
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-start gap-3 text-xs text-zinc-400 leading-relaxed font-mono">
              <ShieldAlert className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-white">Notice regarding OSM Disappearance:</strong>
                <p className="mt-1">
                  This indicates that the place is no longer present in the latest OpenStreetMap snapshot. It does not guarantee business closure.
                </p>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono">
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Significance Score</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">{change.significance_score}</span>
                <span className="text-xs text-zinc-500">/ 100</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full"
                  style={{ width: `${change.significance_score}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Matching Confidence</span>
              <div className="text-2xl font-black text-white">{confidencePct}%</div>
              <span className="text-[11px] text-zinc-500 block mt-1">Deterministic ID / Proximity</span>
            </div>

            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Data Source</span>
              <div className="text-base font-bold text-white flex items-center gap-1">
                <span>OpenStreetMap</span>
                <a
                  href="https://www.openstreetmap.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <span className="text-[11px] text-zinc-500 block mt-1">Ext ID: {change.entity_id}</span>
            </div>
          </div>
        </div>

        {/* Location Map */}
        {location && (
          <div className="mono-card rounded-xl p-5 border border-zinc-800 shadow-2xl space-y-3 font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white" />
              <span>Location Coordinates</span>
            </h3>
            <div className="h-[300px]">
              <MapComponent
                location={location}
                changes={[change]}
                selectedChangeId={change.id}
              />
            </div>
          </div>
        )}

        {/* Old vs New Data Comparison (JSON View) */}
        <div className="mono-card rounded-xl p-6 border border-zinc-800 shadow-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-white" />
            <span>Raw Snapshot Data Comparison</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Previous Snapshot Data</h4>
              <pre className="bg-zinc-950 text-zinc-300 border border-zinc-800 text-xs p-4 rounded-lg overflow-x-auto font-mono max-h-60">
                {change.old_data ? JSON.stringify(change.old_data, null, 2) : 'null (New place addition)'}
              </pre>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Current Snapshot Data</h4>
              <pre className="bg-zinc-950 text-zinc-300 border border-zinc-800 text-xs p-4 rounded-lg overflow-x-auto font-mono max-h-60">
                {change.new_data ? JSON.stringify(change.new_data, null, 2) : 'null (Disappeared from snapshot)'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
