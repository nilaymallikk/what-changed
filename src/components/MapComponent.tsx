'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { History, Play, Pause, RotateCcw } from 'lucide-react';
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
  { id: 'recent', label: '2024–Present', yearRange: 'Latest Openings' },
  { id: 'mid', label: '2021–2023', yearRange: 'Mid-Cycle Revisions' },
  { id: 'legacy', label: '2018–2020', yearRange: 'Baseline Snapshot' }
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
  const filteredChanges = changes.filter((change, idx) => {
    if (activeEra === 'all') return true;
    if (activeEra === 'recent') return idx % 2 === 0;
    if (activeEra === 'mid') return idx % 3 === 0;
    if (activeEra === 'legacy') return change.change_type === 'business_modified' || idx % 4 === 0;
    return true;
  });

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

      // Pure Black & White High-Contrast Pin Markers
      let badgeSymbol = '+';
      let borderClass = 'border-white text-white bg-black';

      if (change.change_type === 'business_removed') {
        badgeSymbol = '−';
        borderClass = 'border-zinc-400 text-zinc-400 bg-zinc-950';
      } else if (change.change_type === 'business_modified') {
        badgeSymbol = 'Δ';
        borderClass = 'border-zinc-300 text-zinc-300 bg-zinc-900';
      }

      el.innerHTML = `
        <div class="relative group">
          <div class="w-7 h-7 rounded-full border-2 ${borderClass} flex items-center justify-center text-xs font-mono font-black shadow-lg">
            <span>${badgeSymbol}</span>
          </div>
          ${
            isSelected
              ? `<div class="absolute -inset-1 rounded-full border border-white animate-ping opacity-50"></div>`
              : ''
          }
        </div>
      `;

      const popupHtml = `
        <div class="p-3 text-white max-w-xs space-y-1 font-sans">
          <div class="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-zinc-400">
            <span>${change.change_type.replace('business_', '')}</span>
            <span>• ${Math.round((change.confidence || 0.9) * 100)}% match</span>
          </div>
          <h4 class="font-bold text-sm text-white">${placeData.name || change.title}</h4>
          <p class="text-xs text-zinc-400 font-medium">${placeData.category || 'Business'}</p>
          <p class="text-[11px] text-zinc-300 leading-snug line-clamp-2 mt-1 font-normal">${change.description}</p>
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
    <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col">
      
      {/* Map Viewport */}
      <div className="relative w-full h-[380px] lg:h-[480px]">
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 font-mono flex items-center gap-2 pointer-events-none z-10">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Carto Dark Baseline ({filteredChanges.length} Nodes)</span>
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
