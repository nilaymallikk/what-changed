'use client';

import React, { useEffect, useState } from 'react';
import { Camera, ExternalLink, ImageOff, Loader2, MoveHorizontal } from 'lucide-react';
import type { GeoLocation, StreetViewCapture, StreetViewData } from '@/types';

function formatDate(capture: StreetViewCapture | null) {
  if (!capture) return 'Unavailable';
  const date = new Date(capture.captured_at);
  return Number.isNaN(date.getTime()) ? capture.captured_at : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export function BeforeAfterStreetView({ location }: { location: GeoLocation }) {
  const [data, setData] = useState<StreetViewData | null>(null);
  const [position, setPosition] = useState(50);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude) });
    setData(null);
    fetch(`/api/street-view?${query}`, { signal: controller.signal })
      .then((response) => response.json())
      .then(setData)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setData({ before: null, after: null, captures_found: 0, source: 'KartaView', coverage: 'Street imagery is temporarily unavailable.', methodology: 'No synthetic imagery is displayed.' });
        }
      });
    return () => controller.abort();
  }, [location.latitude, location.longitude]);

  if (!data) {
    return (
      <section className="h-48 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-xs text-zinc-400 font-mono">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Searching dated street imagery…
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800/90 bg-zinc-950 shadow-xl overflow-hidden font-mono">
      <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Camera className="w-4 h-4 text-amber-400" /> Before / After Street Imagery
            <span className="px-2 py-0.5 text-[9px] rounded border border-zinc-700 text-zinc-400">{data.captures_found} CAPTURES</span>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-1">Closest compatible public captures near the ZIP centroid.</p>
        </div>
        {data.after && (
          <a href={data.after.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white">
            View source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {data.after ? (
        data.before ? (
          <div className="relative h-[320px] sm:h-[440px] select-none overflow-hidden bg-black">
            <img src={data.after.image_url} alt={`Street capture from ${formatDate(data.after)}`} className="absolute inset-0 w-full h-full object-cover" />
            <img
              src={data.before.image_url}
              alt={`Street capture from ${formatDate(data.before)}`}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            />
            <div className="absolute inset-y-0 border-r-2 border-white pointer-events-none" style={{ left: `${position}%` }} />
            <div className="absolute top-3 left-3 bg-black/85 border border-zinc-700 rounded px-2 py-1 text-[10px] text-white">BEFORE · {formatDate(data.before)}</div>
            <div className="absolute top-3 right-3 bg-black/85 border border-zinc-700 rounded px-2 py-1 text-[10px] text-white">AFTER · {formatDate(data.after)}</div>
            <div className="absolute inset-y-0 -ml-3 w-6 flex items-center justify-center pointer-events-none" style={{ left: `${position}%` }}>
              <span className="w-8 h-8 rounded-full bg-white text-black border-2 border-black flex items-center justify-center shadow-2xl"><MoveHorizontal className="w-4 h-4" /></span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              aria-label="Reveal before or after street image"
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />
          </div>
        ) : (
          <div className="relative h-[320px] sm:h-[440px] bg-black">
            <img src={data.after.image_url} alt={`Street capture from ${formatDate(data.after)}`} className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 bg-black/85 border border-zinc-700 rounded px-2 py-1 text-[10px] text-white">ONLY CAPTURE · {formatDate(data.after)}</div>
          </div>
        )
      ) : (
        <div className="min-h-52 flex flex-col items-center justify-center text-center p-8 bg-black/40">
          <ImageOff className="w-7 h-7 text-zinc-600 mb-3" />
          <p className="text-sm font-semibold text-white">No public street imagery found</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-lg">{data.coverage}</p>
        </div>
      )}

      <div className="px-5 py-3 border-t border-zinc-800 text-[10px] text-zinc-500 space-y-1">
        <p>{data.source} · {data.coverage}</p>
        <p>{data.methodology}</p>
      </div>
    </section>
  );
}
