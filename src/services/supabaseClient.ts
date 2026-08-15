import { createClient } from '@supabase/supabase-js';
import type { Area, Snapshot, Change, AISummary, DataFetchRun, Place } from '../types';


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://sb-whatchanged.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_RGX4-5Cs1oBgHjKf69T9_Q_FJMh7zl0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// In-Memory & LocalStorage Store for fast local caching
class LocalStateStore {
  private STORAGE_KEY = 'whatchanged_local_db_v2';

  private getStore(): {
    areas: Area[];
    snapshots: Snapshot[];
    places: Place[];
    changes: Change[];
    ai_summaries: AISummary[];
    fetch_runs: DataFetchRun[];
  } {
    if (typeof window === 'undefined') {
      return { areas: [], snapshots: [], places: [], changes: [], ai_summaries: [], fetch_runs: [] };
    }
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Strict real-data filter: Purge any legacy mockup or demo entries
        const cleanChanges = (parsed.changes || []).filter((c: any) => !c.id?.startsWith('demo_') && !c.is_demo);
        return {
          areas: parsed.areas || [],
          snapshots: parsed.snapshots || [],
          places: parsed.places || [],
          changes: cleanChanges,
          ai_summaries: parsed.ai_summaries || [],
          fetch_runs: parsed.fetch_runs || []
        };
      }
    } catch (e) {
      console.warn("LocalStorage access failed:", e);
    }
    return { areas: [], snapshots: [], places: [], changes: [], ai_summaries: [], fetch_runs: [] };
  }

  private saveStore(store: any) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn("Failed to write to LocalStorage:", e);
    }
  }

  getAreaByZip(zip: string): Area | null {
    const store = this.getStore();
    return store.areas.find(a => a.zip_code === zip.trim()) || null;
  }

  saveArea(area: Area): Area {
    const store = this.getStore();
    const existingIdx = store.areas.findIndex(a => a.zip_code === area.zip_code);
    if (existingIdx >= 0) {
      store.areas[existingIdx] = { ...store.areas[existingIdx], ...area, updated_at: new Date().toISOString() };
    } else {
      store.areas.push(area);
    }
    this.saveStore(store);
    return area;
  }

  getSnapshots(areaId: string): Snapshot[] {
    const store = this.getStore();
    return store.snapshots.filter(s => s.area_id === areaId);
  }

  saveSnapshot(snapshot: Snapshot): Snapshot {
    const store = this.getStore();
    store.snapshots.push(snapshot);
    this.saveStore(store);
    return snapshot;
  }

  getChanges(areaId: string): Change[] {
    const store = this.getStore();
    return store.changes.filter(c => c.area_id === areaId);
  }

  saveChanges(changes: Change[]) {
    const store = this.getStore();
    // avoid duplication by id
    const newChanges = changes.filter(c => !store.changes.some(sc => sc.id === c.id));
    store.changes = [...newChanges, ...store.changes];
    this.saveStore(store);
  }

  getAISummary(areaId: string): AISummary | null {
    const store = this.getStore();
    return store.ai_summaries.find(s => s.area_id === areaId) || null;
  }

  saveAISummary(summary: AISummary) {
    const store = this.getStore();
    const existingIdx = store.ai_summaries.findIndex(s => s.area_id === summary.area_id);
    if (existingIdx >= 0) {
      store.ai_summaries[existingIdx] = summary;
    } else {
      store.ai_summaries.unshift(summary);
    }
    this.saveStore(store);
  }

  getFetchRuns(): DataFetchRun[] {
    return this.getStore().fetch_runs;
  }

  saveFetchRun(run: DataFetchRun) {
    const store = this.getStore();
    store.fetch_runs.unshift(run);
    this.saveStore(store);
  }

  getAllStats() {
    const store = this.getStore();
    return {
      areasCount: store.areas.length,
      snapshotsCount: store.snapshots.length,
      placesCount: store.places.length,
      changesCount: store.changes.length,
      runsCount: store.fetch_runs.length
    };
  }
}

export const localDB = new LocalStateStore();
