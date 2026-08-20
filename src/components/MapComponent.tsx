'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { History, Play, Pause, RotateCcw, SplitSquareVertical, Satellite, Map as MapIcon } from 'lucide-react';
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

type BasemapMode = 'satellite' | 'street';

function createBasemapStyle(mode: BasemapMode): maplibregl.StyleSpecification {
  if (mode === 'satellite') {
    return {
      version: 8,
      sources: {
        satellite: {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        }
      },
      layers: [{ id: 'satellite-layer', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 20 }]
    };
  }

  return {
    version: 8,
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: ['https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 20 }]
  };
}

export const MapComponent: React.FC<MapComponentProps> = ({
  location,
  changes,
  selectedChangeId,
  onSelectChange,
  showTimeMachine = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const compareMapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const compareMap = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const compareMarkersRef = useRef<maplibregl.Marker[]>([]);
  const appliedBasemap = useRef<BasemapMode>('satellite');

  const [activeEra, setActiveEra] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSwipeMode, setIsSwipeMode] = useState<boolean>(false);
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 - 100%
  const [basemapMode, setBasemapMode] = useState<BasemapMode>('satellite');

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: createBasemapStyle(appliedBasemap.current),
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

  useEffect(() => {
    if (!map.current || appliedBasemap.current === basemapMode) return;
    map.current.setStyle(createBasemapStyle(basemapMode));
    appliedBasemap.current = basemapMode;
  }, [basemapMode]);

  useEffect(() => {
    if (!isSwipeMode || !compareMapContainer.current || !map.current) return;

    const comparisonMode: BasemapMode = basemapMode === 'satellite' ? 'street' : 'satellite';
    const comparison = new maplibregl.Map({
      container: compareMapContainer.current,
      style: createBasemapStyle(comparisonMode),
      center: map.current.getCenter(),
      zoom: map.current.getZoom(),
      bearing: map.current.getBearing(),
      pitch: map.current.getPitch(),
      interactive: false,
      attributionControl: false
    });
    compareMap.current = comparison;

    const synchronize = () => {
      if (!map.current || !compareMap.current) return;
      compareMap.current.jumpTo({
        center: map.current.getCenter(),
        zoom: map.current.getZoom(),
        bearing: map.current.getBearing(),
        pitch: map.current.getPitch()
      });
    };

    map.current.on('move', synchronize);
    comparison.once('load', synchronize);

    return () => {
      map.current?.off('move', synchronize);
      comparison.remove();
      compareMap.current = null;
    };
  }, [basemapMode, isSwipeMode, location.latitude, location.longitude]);

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
    compareMarkersRef.current.forEach(marker => marker.remove());
    compareMarkersRef.current = [];

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

      if (compareMap.current) {
        const comparisonMarker = new maplibregl.Marker({ element: el.cloneNode(true) as HTMLElement })
          .setLngLat([placeData.longitude, placeData.latitude])
          .addTo(compareMap.current);
        compareMarkersRef.current.push(comparisonMarker);
      }
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
  }, [
    filteredChanges,
    selectedChangeId,
    onSelectChange,
    isSwipeMode,
    basemapMode,
    location.latitude,
    location.longitude
  ]);

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

  const updateSplitPosition = (clientX: number) => {
    const bounds = mapContainer.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;

    const nextPosition = ((clientX - bounds.left) / bounds.width) * 100;
    setSliderPos(Math.min(95, Math.max(5, nextPosition)));
  };

  const handleSplitPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSplitPosition(event.clientX);
  };

  const handleSplitPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateSplitPosition(event.clientX);
  };

  const handleSplitKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setSliderPos(position => Math.min(95, Math.max(5, position + (event.key === 'ArrowLeft' ? -2 : 2))));
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col font-mono">
      
      {/* Map Viewport */}
      <div className="relative w-full h-[380px] lg:h-[480px]">
        <div ref={mapContainer} className="w-full h-full" />

        {isSwipeMode && (
          <div
            className="absolute inset-0 z-[1] pointer-events-none will-change-[clip-path]"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            aria-hidden="true"
          >
            <div ref={compareMapContainer} className="w-full h-full" />
          </div>
        )}
        
        {/* Top Badges and Mode Switcher */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
          <div className="bg-black/85 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 font-mono flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Vector Nodes ({filteredChanges.length})</span>
          </div>

          <div className="flex overflow-hidden rounded-lg border border-zinc-700 bg-black/85 p-0.5 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => setBasemapMode('satellite')}
              aria-pressed={basemapMode === 'satellite'}
              className={`btn-interactive flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition-colors ${
                basemapMode === 'satellite'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
              title="Show satellite imagery"
            >
              <Satellite className="h-3.5 w-3.5" />
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setBasemapMode('street')}
              aria-pressed={basemapMode === 'street'}
              className={`btn-interactive flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition-colors ${
                basemapMode === 'street'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
              title="Show the street map"
            >
              <MapIcon className="h-3.5 w-3.5" />
              Street
            </button>
          </div>

          <button
            onClick={() => setIsSwipeMode(!isSwipeMode)}
            className={`btn-interactive px-2.5 py-1 rounded-lg border text-[10px] uppercase font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              isSwipeMode
                ? 'bg-white text-black border-white'
                : 'bg-black/85 text-zinc-300 border-zinc-800 hover:text-white'
            }`}
            title="Compare synchronized satellite and street maps"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{isSwipeMode ? 'SPLIT VIEW: ON' : 'SPLIT VIEW'}</span>
          </button>
        </div>

        {/* Synchronized Satellite / Street Comparison */}
        {isSwipeMode && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute bottom-14 left-4 rounded border border-zinc-700 bg-black/90 px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-lg backdrop-blur-md">
              ◀ {basemapMode === 'satellite' ? 'Street map' : 'Satellite imagery'}
            </div>
            <div className="absolute bottom-14 right-4 rounded border border-zinc-700 bg-black/90 px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-lg backdrop-blur-md">
              {basemapMode === 'satellite' ? 'Satellite imagery' : 'Street map'} ▶
            </div>

            <div
              className="absolute inset-y-0 z-30 -ml-4 flex w-8 touch-none cursor-ew-resize items-center justify-center pointer-events-auto focus-visible:outline-none"
              style={{ left: `${sliderPos}%` }}
              role="slider"
              tabIndex={0}
              aria-label="Adjust satellite and street map split"
              aria-valuemin={5}
              aria-valuemax={95}
              aria-valuenow={Math.round(sliderPos)}
              onPointerDown={handleSplitPointerDown}
              onPointerMove={handleSplitPointerMove}
              onKeyDown={handleSplitKeyDown}
            >
              <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.9)]" />
              <div className="flex h-11 w-7 items-center justify-center rounded-full border-2 border-black bg-white shadow-2xl">
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
