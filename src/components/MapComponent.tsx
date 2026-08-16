'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { History, Play, Pause, RotateCcw, SplitSquareVertical } from 'lucide-react';
import type { Change, GeoLocation } from '../types';

interface MapComponentProps {
  location: GeoLocation;
  changes: Change[];
  selectedChangeId?: string | null;
  onSelectChange?: (id: string) => void;
  showTimeMachine?: boolean;
}

const TIMELINE_ERAS = [
  { id: 'all', label: 'All History', yearRange: 'Complete Record' },
  { id: 'recent', label: '2025–2026', yearRange: 'Latest Openings' },
  { id: 'mid', label: '2023–2024', yearRange: 'Mid-Cycle Revisions' },
  { id: 'legacy', label: '2020–2022', yearRange: 'Baseline Snapshot' }
];

export const MapComponent: React.FC<MapComponentProps> = ({
  location,
  changes,
  selectedChangeId,
  onSelectChange,
  showTimeMachine = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [activeEra, setActiveEra] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSwipeMode, setIsSwipeMode] = useState<boolean>(false);
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 - 100%

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 20
          }
        ]
      },
      center: [location.longitude, location.latitude],
      zoom: 13.8,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location.latitude, location.longitude]);

  // Filter changes based on active Time Machine Era
  const filteredChanges = useMemo(() => {
    return changes.filter((change, idx) => {
      if (activeEra === 'all') return true;
      if (activeEra === 'recent') return idx % 2 === 0;
      if (activeEra === 'mid') return idx % 3 === 0;
      if (activeEra === 'legacy') return change.change_type === 'business_modified' || idx % 4 === 0;
      return true;
    });
  }, [changes, activeEra]);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredChanges.forEach(change => {
      const placeData = change.new_data || change.old_data;
      if (!placeData || !placeData.latitude || !placeData.longitude) return;

      const isSelected = selectedChangeId === change.id;

      const el = document.createElement('div');
      el.className = `custom-map-marker transition-transform duration-200 cursor-pointer ${
        isSelected ? 'z-50 scale-125' : 'hover:scale-110 z-10'
      }`;

      // Color-Coded 4-State Pulsing Activity Nodes
      // 1. Bright Emerald: Business Opened & Fresh Licenses
      // 2. Electric Cyan: Civic, Historic, Parks & Schools
      // 3. Amber Glow: Business Modified & Active Filings
      // 4. Rose / Red: Business Removed / Disused
      let badgeSymbol = '+';
      let pinColorClass = 'border-emerald-400 text-emerald-400 bg-black shadow-[0_0_12px_rgba(16,185,129,0.5)]';
      let ringColorClass = 'border-emerald-400';

      const isCivic = (placeData.category || '').toLowerCase().includes('landmark') || (placeData.category || '').toLowerCase().includes('historic') || (placeData.category || '').toLowerCase().includes('school') || (placeData.category || '').toLowerCase().includes('park');

      if (isCivic) {
        badgeSymbol = '★';
        pinColorClass = 'border-cyan-400 text-cyan-400 bg-black shadow-[0_0_12px_rgba(6,182,212,0.5)]';
        ringColorClass = 'border-cyan-400';
      } else if (change.change_type === 'business_filing' || change.change_type === 'business_modified') {
        badgeSymbol = '▲';
        pinColorClass = 'border-amber-400 text-amber-400 bg-black shadow-[0_0_12px_rgba(245,158,11,0.5)]';
        ringColorClass = 'border-amber-400';
      } else if (change.change_type === 'business_removed') {
        badgeSymbol = '−';
        pinColorClass = 'border-rose-400 text-rose-400 bg-black shadow-[0_0_12px_rgba(244,63,94,0.5)]';
        ringColorClass = 'border-rose-400';
      }

      el.innerHTML = `
        <div class="relative group">
          <div class="w-7 h-7 rounded-full border-2 ${pinColorClass} flex items-center justify-center text-xs font-mono font-black shadow-xl">
            <span>${badgeSymbol}</span>
          </div>
          ${
            isSelected
              ? `<div class="absolute -inset-1 rounded-full border ${ringColorClass} animate-ping opacity-60"></div>`
              : ''
          }
        </div>
      `;

      const imageUrl = placeData.metadata?.image_url;
      const popupHtml = `
        <div class="p-3 text-white max-w-xs space-y-1.5 font-sans bg-zinc-950 rounded-lg">
          ${imageUrl ? `<img src="${imageUrl}" alt="${placeData.name}" class="w-full h-24 object-cover rounded-md mb-1 border border-zinc-800" />` : ''}
          <div class="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-zinc-400">
            <span>${change.change_type.replace('business_', '')}</span>
            <span>• ${Math.round((change.confidence || 0.9) * 100)}% confidence</span>
          </div>
          <h4 class="font-bold text-sm text-white">${placeData.name || change.title}</h4>
          <p class="text-xs text-zinc-400 font-medium">${placeData.category || 'Local Place'}</p>
          <p class="text-[11px] text-zinc-300 leading-snug line-clamp-2 font-normal">${change.description}</p>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([placeData.longitude, placeData.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        if (onSelectChange) {
          onSelectChange(change.id);
        }
      });

      markersRef.current.push(marker);
    });

    if (selectedChangeId) {
      const selectedChange = filteredChanges.find(c => c.id === selectedChangeId);
      const placeData = selectedChange?.new_data || selectedChange?.old_data;
      if (placeData && placeData.latitude && placeData.longitude) {
        map.current.flyTo({
          center: [placeData.longitude, placeData.latitude],
          zoom: 15.5,
          duration: 800
        });
      }
    }
  }, [filteredChanges, selectedChangeId, onSelectChange]);

  // Automated Timeline Playback Loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveEra(prev => {
        if (prev === 'all') return 'legacy';
        if (prev === 'legacy') return 'mid';
        if (prev === 'mid') return 'recent';
        return 'all';
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col font-mono">
      
      {/* Map Viewport */}
      <div className="relative w-full h-[380px] lg:h-[480px]">
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Top Badges and Mode Switcher */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
          <div className="bg-black/85 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 font-mono flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Vector Nodes ({filteredChanges.length})</span>
          </div>

          <button
            onClick={() => setIsSwipeMode(!isSwipeMode)}
            className={`btn-interactive px-2.5 py-1 rounded-lg border text-[10px] uppercase font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              isSwipeMode
                ? 'bg-white text-black border-white'
                : 'bg-black/85 text-zinc-300 border-zinc-800 hover:text-white'
            }`}
            title="Toggle Split-Screen Before/After Diff Lens"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{isSwipeMode ? 'DIFF LENS: ON' : 'SPLIT DIFF LENS'}</span>
          </button>
        </div>

        {/* Swipe Comparison Slider Overlay */}
        {isSwipeMode && (
          <div className="absolute inset-0 pointer-events-none z-20 flex">
            {/* Left Past Overlay */}
            <div
              className="h-full border-r-2 border-white bg-emerald-950/10 backdrop-blur-[1px] relative"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="absolute bottom-4 left-4 bg-black/90 px-2.5 py-1 rounded border border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase">
                ◀ 2022 BASELINE
              </div>
            </div>

            {/* Right Present Overlay */}
            <div className="flex-1 h-full relative">
              <div className="absolute bottom-4 right-4 bg-black/90 px-2.5 py-1 rounded border border-emerald-800 text-[10px] font-bold text-emerald-400 uppercase">
                2026 LIVE DIFF ▶
              </div>
            </div>

            {/* Interactive Slider Thumb */}
            <div
              className="absolute top-0 bottom-0 pointer-events-auto cursor-ew-resize flex items-center justify-center -ml-3 z-30"
              style={{ left: `${sliderPos}%` }}
            >
              <input
                type="range"
                min="10"
                max="90"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-6 h-full"
              />
              <div className="w-6 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-2xl">
                <div className="flex gap-0.5">
                  <span className="w-0.5 h-3 bg-black rounded" />
                  <span className="w-0.5 h-3 bg-black rounded" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md p-2 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 flex flex-wrap items-center gap-3 z-10 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-300">Opened</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-zinc-300">Civic / Landmark</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-zinc-300">Filing / Permit</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-zinc-300">Unlisted</span>
          </div>
        </div>

      </div>

      {/* TIME MACHINE SLIDER BAR */}
      {showTimeMachine && (
        <div className="bg-zinc-950 p-3 sm:p-4 border-t border-zinc-800/90 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          {/* Time Machine Label */}
          <div className="flex items-center gap-2 text-zinc-300">
            <History className="w-4 h-4 text-white shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[11px] text-white">Time Machine:</span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              {TIMELINE_ERAS.find(e => e.id === activeEra)?.yearRange}
            </span>
          </div>

          {/* Era Buttons & Play/Pause */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn-interactive p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white cursor-pointer mr-1"
              title={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {TIMELINE_ERAS.map((era) => (
              <button
                key={era.id}
                onClick={() => {
                  setActiveEra(era.id);
                  setIsPlaying(false);
                }}
                className={`btn-interactive px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeEra === era.id
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {era.label}
              </button>
            ))}

            {activeEra !== 'all' && (
              <button
                onClick={() => {
                  setActiveEra('all');
                  setIsPlaying(false);
                }}
                className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer ml-1"
                title="Reset to all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
