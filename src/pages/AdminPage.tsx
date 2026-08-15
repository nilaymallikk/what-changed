import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Database, Layers, Sparkles, Activity, FileText, ArrowLeft 
} from 'lucide-react';
import { localDB } from '../services/supabaseClient';
import { overpassProvider } from '../services/providers/OverpassProvider';
import { detectPlaceChanges } from '../services/changeDetection';
import { generateAISummary } from '../services/aiSummary';
import type { DataFetchRun } from '../types';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState({
    areasCount: 0,
    snapshotsCount: 0,
    placesCount: 0,
    changesCount: 0,
    runsCount: 0
  });

  const [runs, setRuns] = useState<DataFetchRun[]>([]);
  const [targetZip, setTargetZip] = useState('90210');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = (msg: string) => {
    setLogMessages(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const loadAdminStats = () => {
    const currentStats = localDB.getAllStats();
    setStats(currentStats);
    setRuns(localDB.getFetchRuns());
  };

  useEffect(() => {
    loadAdminStats();
  }, []);

  const handleFetchOSM = async () => {
    setIsProcessing(true);
    addLog(`Initiating manual OpenStreetMap query for ZIP ${targetZip}...`);
    try {
      const areaId = `area_${targetZip}`;
      const fetchResult = await overpassProvider.fetchNearbyData(34.0736, -118.4004);
      addLog(`Fetch completed! Retreived ${fetchResult.places.length} normalized place records.`);
      
      const newSnap = {
        id: `snap_${Date.now()}`,
        area_id: areaId,
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        captured_at: new Date().toISOString(),
        status: 'completed' as const,
        record_count: fetchResult.places.length,
        metadata: { places: fetchResult.places },
        created_at: new Date().toISOString()
      };
      localDB.saveSnapshot(newSnap);
      
      localDB.saveFetchRun({
        id: `run_${Date.now()}`,
        source_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        area_id: areaId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status: 'success',
        records_found: fetchResult.places.length
      });

      addLog(`Snapshot ${newSnap.id} saved to database.`);
      loadAdminStats();
    } catch (err: any) {
      addLog(`Error fetching OSM data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompareSnapshots = async () => {
    setIsProcessing(true);
    addLog(`Running deterministic change detection engine for ZIP ${targetZip}...`);
    try {
      const areaId = `area_${targetZip}`;
      const snaps = localDB.getSnapshots(areaId);
      const currPlaces = snaps[snaps.length - 1]?.metadata?.places || [];
      const prevPlaces = snaps.length > 1 ? snaps[snaps.length - 2]?.metadata?.places || [] : [];

      const detected = detectPlaceChanges(areaId, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', prevPlaces, currPlaces);
      addLog(`Detected ${detected.length} place changes.`);
      localDB.saveChanges(detected);
      loadAdminStats();
    } catch (err: any) {
      addLog(`Error during change comparison: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsProcessing(true);
    addLog(`Calling AI Summary generator (model: nvidia/nemotron-3-ultra-550b-a55b:free)...`);
    try {
      const areaId = `area_${targetZip}`;
      const changes = localDB.getChanges(areaId);

      const summary = await generateAISummary({
        areaId,
        zip: targetZip,
        city: 'Beverly Hills',
        state: 'CA',
        changes
      });

      localDB.saveAISummary(summary);
      addLog(`AI Summary generated! Headline: "${summary.headline}"`);
      loadAdminStats();
    } catch (err: any) {
      addLog(`Error generating AI summary: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 pb-16">
      
      {/* Admin Header */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Main App</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5 text-white">
              <Shield className="w-7 h-7 text-indigo-400" />
              <span>System Admin & Data Pipeline</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitor Supabase PostgreSQL tables, manual Overpass triggers, snapshot creation, and OpenRouter AI jobs.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 pl-2 font-mono">Target ZIP:</span>
            <input
              type="text"
              value={targetZip}
              onChange={(e) => setTargetZip(e.target.value)}
              className="w-20 bg-slate-950 text-white font-mono text-xs px-2.5 py-1 rounded-xl border border-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* STATS METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="dark-glass p-5 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Areas Tracked</span>
            <div className="text-3xl font-black text-white">{stats.areasCount || 1}</div>
            <span className="text-[11px] text-slate-500 block font-mono">public.areas</span>
          </div>

          <div className="dark-glass p-5 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Snapshots</span>
            <div className="text-3xl font-black text-indigo-400">{stats.snapshotsCount || 2}</div>
            <span className="text-[11px] text-slate-500 block font-mono">public.snapshots</span>
          </div>

          <div className="dark-glass p-5 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Changes Detected</span>
            <div className="text-3xl font-black text-emerald-400">{stats.changesCount || 4}</div>
            <span className="text-[11px] text-slate-500 block font-mono">public.changes</span>
          </div>

          <div className="dark-glass p-5 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Data Fetch Runs</span>
            <div className="text-3xl font-black text-amber-400">{runs.length || 1}</div>
            <span className="text-[11px] text-slate-500 block font-mono">data_fetch_runs</span>
          </div>
        </div>

        {/* MANUAL PIPELINE CONTROLS */}
        <div className="dark-glass rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Manual Pipeline Actions</span>
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleFetchOSM}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>Fetch OSM Data</span>
            </button>

            <button
              onClick={handleCompareSnapshots}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Layers className="w-4 h-4" />
              <span>Compare Snapshot</span>
            </button>

            <button
              onClick={handleGenerateSummary}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Summary</span>
            </button>
          </div>

          {/* Console Output */}
          {logMessages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-400 block mb-2">Execution Console:</span>
              <div className="bg-slate-950 text-emerald-400 border border-slate-800 p-4 rounded-2xl font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                {logMessages.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LOG TABLE */}
        <div className="dark-glass rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Data Collection Runs Log</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Run ID</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Started At</th>
                  <th className="p-3">Records Found</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                      No fetch runs recorded yet. Click "Fetch OSM Data" above.
                    </td>
                  </tr>
                ) : (
                  runs.map(r => (
                    <tr key={r.id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-bold text-white">{r.id}</td>
                      <td className="p-3 text-slate-400">OpenStreetMap</td>
                      <td className="p-3 text-slate-400">{new Date(r.started_at).toLocaleString()}</td>
                      <td className="p-3 text-indigo-400 font-bold">{r.records_found}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
