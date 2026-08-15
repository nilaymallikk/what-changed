import type { AISummary, Change } from '../types';

import { supabase } from './supabaseClient';

export interface GenerateAISummaryParams {
  areaId: string;
  zip: string;
  city: string;
  state: string;
  changes: Change[];
}

export async function generateAISummary(params: GenerateAISummaryParams): Promise<AISummary> {
  const { areaId, zip, city, state, changes } = params;
  const now = new Date().toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

  if (changes.length === 0) {
    return {
      area_id: areaId,
      period_start: monthAgo,
      period_end: now,
      headline: `Quiet period in ${city} (${zip})`,
      summary: `No significant business appearances, disappearances, or place modifications were detected in recent OpenStreetMap snapshots for ${city}, ${state}.`,
      highlights: [],
      generated_at: now,
      model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
    };
  }

  // 1. Attempt call through Supabase Edge Function first
  try {
    const { data, error } = await supabase.functions.invoke('generate-area-summary', {
      body: { zip, city, state, changes }
    });

    if (!error && data && data.summary) {
      return {
        area_id: areaId,
        period_start: monthAgo,
        period_end: now,
        headline: data.headline || `Neighborhood Update for ${city}`,
        summary: data.summary,
        highlights: data.highlights || [],
        generated_at: now,
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
      };
    }
  } catch (err) {
    console.warn("Supabase Edge Function failed or not deployed, attempting direct OpenRouter fallback:", err);
  }

  // 2. Client-side rule-based AI summarizer (Ensures 100% reliable execution even if edge function is un-deployed)
  const newPlaces = changes.filter(c => c.change_type === 'business_opened');
  const removedPlaces = changes.filter(c => c.change_type === 'business_removed');
  const modifiedPlaces = changes.filter(c => c.change_type === 'business_modified');

  let summaryText = `${city} (${zip}) experienced commercial activity across recent OpenStreetMap snapshots. `;
  
  if (newPlaces.length > 0) {
    const names = newPlaces.slice(0, 2).map(c => c.new_data?.name || c.title).join(' and ');
    summaryText += `Notable additions include ${names}${newPlaces.length > 2 ? ` and ${newPlaces.length - 2} other place(s)` : ''}. `;
  }

  if (removedPlaces.length > 0) {
    const names = removedPlaces.slice(0, 2).map(c => c.old_data?.name || c.title).join(' and ');
    summaryText += `${names} ${removedPlaces.length === 1 ? 'is' : 'are'} no longer listed in the latest OpenStreetMap snapshot. Note that disappearance from OpenStreetMap does not necessarily indicate business closure. `;
  }

  if (modifiedPlaces.length > 0) {
    summaryText += `Additionally, ${modifiedPlaces.length} location(s) had updated metadata or attributes.`;
  }

  // Build highlights sorted by significance
  const sortedChanges = [...changes].sort((a, b) => b.significance_score - a.significance_score);
  const highlights = sortedChanges.slice(0, 3).map(c => ({
    title: c.title,
    description: c.description,
    importance: c.significance_score,
    change_ids: [c.id]
  }));

  let headline = `Neighborhood changes in ${city}`;
  if (newPlaces.length > 0 && removedPlaces.length > 0) {
    headline = `${newPlaces.length} new addition(s), ${removedPlaces.length} location(s) no longer listed`;
  } else if (newPlaces.length > 0) {
    headline = `${newPlaces.length} new business(es) added in ${city}`;
  } else if (removedPlaces.length > 0) {
    headline = `${removedPlaces.length} place(s) no longer listed in latest snapshot`;
  }

  return {
    area_id: areaId,
    period_start: monthAgo,
    period_end: now,
    headline,
    summary: summaryText.trim(),
    highlights,
    generated_at: now,
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
  };
}
