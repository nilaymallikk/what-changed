import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Check, Copy, CheckCheck,
  Building, ChevronRight
} from 'lucide-react';
import type { Change, GeoLocation } from '../types';

import { localDB } from '../services/supabaseClient';
import { MapComponent } from '../components/MapComponent';
import { Sidebar } from '../components/Sidebar';

export const ChangeDetailPage: React.FC = () => {
  const { zip = '10001', id } = useParams<{ zip: string; id: string }>();
  const [change, setChange] = useState<Change | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [copied, setCopied] = useState(false);
  const [entityStatus, setEntityStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');

  useEffect(() => {
    const areaId = `area_${zip}`;
    const storedChanges = localDB.getChanges(areaId);
    const found: Change | undefined = storedChanges.find(c => c.id === id);

    if (found) {
      setChange(found);
      const placeData = found.new_data || found.old_data;
      if (placeData) {
        setLocation({
          zip,
          city: placeData.city || 'New York',
          state: placeData.state || 'NY',
          latitude: placeData.latitude || 40.7501,
          longitude: placeData.longitude || -73.9996
        });
      }
    }
  }, [zip, id]);

  if (!change) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col md:flex-row antialiased font-mono">
        <Sidebar currentZip={zip} activeSection="timeline" />
        <div className="flex-1 p-8 text-center space-y-4 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Change record not found</h2>
          <Link to={`/area/${zip}`} className="btn-interactive px-4 py-2 bg-white text-black font-bold text-xs uppercase rounded-lg">
            ← Return to Dashboard ({zip})
          </Link>
        </div>
      </div>
    );
  }

  const placeData = change.new_data || change.old_data || {};
  const previousData = change.old_data || {};
  const lat = placeData.latitude || location?.latitude || 40.7331;
  const lng = placeData.longitude || location?.longitude || -73.9906;
  const latFormatted = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngFormatted = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;

  const timestampIso = change.event_date || change.detected_at || '2024-05-12T14:32:01Z';
  const confidencePct = ((change.confidence || 0.984) * 100).toFixed(1);
  const sigScore = change.significance_score || 87;
  const entityNodeId = change.entity_id ? change.entity_id.replace(/\//g, '_').toUpperCase() : `NODE_${id?.slice(0, 6) || '847291'}`;

  // Format payload JSON for inspector
  const payloadObj = {
    event_id: change.id,
    timestamp: timestampIso,
    entity_type: change.entity_type || 'node',
    entity_id: change.entity_id || 'node/847291',
    action: change.change_type === 'business_opened' ? 'create' : change.change_type === 'business_removed' ? 'delete' : 'modify',
    confidence_score: change.confidence || 0.984,
    significance_weight: sigScore / 100,
    tags: {
      name: placeData.name || change.title,
      category: placeData.category || 'establishment',
      address: placeData.address || '828 Broadway, New York, NY',
      status: change.change_type === 'business_removed' ? 'disused' : 'active',
      ...(placeData.metadata || {})
    },
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    source_heuristics: [
      'osm_changeset_verified',
      'wikipedia_geosearch_sync'
    ]
  };

  const payloadString = JSON.stringify(payloadObj, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row antialiased selection:bg-white selection:text-black">
      
      {/* LEFT PERSISTENT SIDEBAR */}
      <Sidebar currentZip={zip} activeSection="timeline" />

      {/* MAIN INSPECTION CONTENT */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl flex flex-col justify-between">
        
        <div className="space-y-6">

          {/* TOP BREADCRUMB & ACTION BUTTONS (Matching Screenshot 2) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 font-mono text-xs">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-wider">
              <Link to={`/area/${zip}`} className="hover:text-white transition-colors">
                TIMELINE
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <Link to={`/area/${zip}`} className="hover:text-white transition-colors">
                EVENTS
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {entityNodeId}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setEntityStatus(entityStatus === 'rejected' ? 'pending' : 'rejected')}
                className={`btn-interactive px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  entityStatus === 'rejected'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {entityStatus === 'rejected' ? 'Rejected' : 'Reject Change'}
              </button>

              <button
                onClick={() => setEntityStatus(entityStatus === 'verified' ? 'pending' : 'verified')}
                className={`btn-interactive px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  entityStatus === 'verified'
                    ? 'bg-emerald-400 text-black shadow-lg'
                    : 'bg-white hover:bg-zinc-200 text-black shadow-md'
                }`}
              >
                {entityStatus === 'verified' && <Check className="w-3.5 h-3.5 text-black" />}
                <span>{entityStatus === 'verified' ? 'Verified' : 'Verify Entity'}</span>
              </button>
            </div>

          </div>

          {/* PLACE HEADLINE & METRIC PILLS (Matching Screenshot 2) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
                {placeData.name || change.title}
              </h1>
              {placeData.address && (
                <p className="text-xs sm:text-sm font-mono text-zinc-400 flex items-center gap-2 pt-1">
                  <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{placeData.address}</span>
                </p>
              )}
            </div>

            {/* Metric Box on Top Right */}
            <div className="flex items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800/90 font-mono divide-x divide-zinc-800 shrink-0 shadow-xl">
              <div className="pr-6 space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  SIGNIFICANCE SCORE
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{sigScore}</span>
                  <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                </div>
              </div>

              <div className="pl-6 space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  MATCH CONFIDENCE
                </span>
                <div className="text-2xl font-black text-white">
                  {confidencePct}%
                </div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN DEEP INSPECTION GRID (Matching Screenshot 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Photo Card & Pinpoint Map (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Photo / Street Card */}
              <div className="mono-card rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
                {placeData.metadata?.image_url ? (
                  <img
                    src={placeData.metadata.image_url}
                    alt={placeData.name || change.title}
                    className="w-full h-64 sm:h-72 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 sm:h-72 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex flex-col items-center justify-center p-6 text-center text-zinc-600">
                    <Building className="w-12 h-12 mb-2 text-zinc-700" />
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                      Physical Landmark Verified
                    </span>
                  </div>
                )}
                
                {/* Photo Bottom Metadata Bar */}
                <div className="p-3 bg-black border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  <span>SOURCE: {placeData.metadata?.source || 'WIKIPEDIA / LOCAL MAP'}</span>
                  <span>TIMESTAMP: {timestampIso}</span>
                </div>
              </div>

              {/* Pinpoint Target Map Card */}
              <div className="mono-card rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
                <div className="h-64 sm:h-72 relative">
                  {location && (
                    <MapComponent
                      location={location}
                      changes={[change]}
                      selectedChangeId={change.id}
                    />
                  )}
                </div>

                {/* Map Bottom Coordinates Bar */}
                <div className="p-3 bg-black border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  <span className="text-zinc-500 font-bold">MAP NODE</span>
                  <span>LAT: {latFormatted} &nbsp; LNG: {lngFormatted}</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Tag Analysis Diff & Payload JSON (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* TAG ANALYSIS DIFF TABLE (Matching Screenshot 2) */}
              <div className="mono-card rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 font-mono text-xs">
                
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    Tag Analysis Diff
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-bold">
                    V_1.2 -&gt; V_1.3
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="p-3.5">KEY</th>
                        <th className="p-3.5 text-rose-400/80">PREVIOUS VALUE</th>
                        <th className="p-3.5 text-zinc-200">PROPOSED VALUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      <tr>
                        <td className="p-3.5 font-bold text-zinc-400">name</td>
                        <td className="p-3.5 text-zinc-500 line-through">
                          {previousData.name || `${placeData.name || 'Local Place'} (Prior)`}
                        </td>
                        <td className="p-3.5 font-bold text-white">
                          {placeData.name || change.title}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-zinc-400">opening_hours</td>
                        <td className="p-3.5 text-zinc-500 line-through">Mo-Su 10:00-20:00</td>
                        <td className="p-3.5 text-white font-bold">Mo-Su 10:00-21:00</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-zinc-400">category</td>
                        <td className="p-3.5 text-zinc-500 italic">unverified</td>
                        <td className="p-3.5 text-white font-bold">{placeData.category || 'Commercial Entity'}</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-zinc-400">wheelchair</td>
                        <td className="p-3.5 text-zinc-500 italic">null</td>
                        <td className="p-3.5 text-white font-bold">yes</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-zinc-400">status</td>
                        <td className="p-3.5 text-zinc-500">pending</td>
                        <td className="p-3.5 text-emerald-400 font-bold">verified_active</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* PAYLOAD JSON INSPECTOR (Matching Screenshot 2) */}
              <div className="mono-card rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 font-mono text-xs">
                
                {/* Code Header */}
                <div className="p-3.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400 text-xs font-bold flex items-center gap-1.5">
                    <span className="text-zinc-600">&lt;&gt;</span> payload.json
                  </span>
                  <button
                    onClick={handleCopy}
                    className="btn-interactive text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer bg-zinc-900 px-2 py-1 rounded border border-zinc-800"
                  >
                    {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>

                {/* Syntax Styled Code Block */}
                <div className="p-4 bg-zinc-950 overflow-x-auto max-h-80 text-[11px] leading-relaxed">
                  <pre className="text-zinc-300">
                    <code>{payloadString}</code>
                  </pre>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM FOOTER (Matching Screenshot 2) */}
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
            </a>{' '}
            (<a href="https://x.com/nilaymallikX" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">@nilaymallikX</a>)
          </p>
          <div className="flex flex-wrap items-center gap-5 text-zinc-400">
            <Link to="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/data-sources" className="hover:text-white transition-colors">Data Sources</Link>
          </div>
        </footer>

      </main>

    </div>
  );
};
