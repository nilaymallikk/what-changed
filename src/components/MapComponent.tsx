'use client';

import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Change, GeoLocation } from '../types';

interface MapComponentProps {
  location: GeoLocation;
  changes: Change[];
  selectedChangeId?: string | null;
  onSelectChange?: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  location,
  changes,
  selectedChangeId,
  onSelectChange
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

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

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    changes.forEach(change => {
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
      const selectedChange = changes.find(c => c.id === selectedChangeId);
      const placeData = selectedChange?.new_data || selectedChange?.old_data;
      if (placeData && placeData.latitude && placeData.longitude) {
        map.current.flyTo({
          center: [placeData.longitude, placeData.latitude],
          zoom: 15.5,
          duration: 800
        });
      }
    }
  }, [changes, selectedChangeId, onSelectChange]);

  return (
    <div className="relative w-full h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 font-mono flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>Carto Dark Tile Baseline</span>
      </div>
    </div>
  );
};
