'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { AlertTriangle, Loader2, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import type { GeoLocation, SafetyData, SafetyIncident } from '@/types';

function IncidentMap({ location, incidents }: { location: GeoLocation; incidents: SafetyIncident[] }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || !incidents.length) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap &copy; CARTO'
          }
        },
        layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }]
      },
      center: [location.longitude, location.latitude],
      zoom: 12.3
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('safety-incidents', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: incidents.map((incident) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [incident.longitude, incident.latitude] },
            properties: {
              id: incident.id,
              category: incident.category,
              description: incident.description,
              address: incident.address,
              occurred_at: incident.occurred_at,
              severity: incident.severity
            }
          }))
        }
      });
      map.addLayer({
        id: 'safety-heat',
        type: 'heatmap',
        source: 'safety-incidents',
        maxzoom: 16,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 0, 0.25, 1, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 15, 2.4],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(9,9,11,0)',
            0.2, 'rgba(6,182,212,0.35)',
            0.45, 'rgba(250,204,21,0.55)',
            0.7, 'rgba(249,115,22,0.7)',
            1, 'rgba(244,63,94,0.88)'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 14, 15, 28],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.92, 16, 0.35]
        }
      });
      map.addLayer({
        id: 'safety-points',
        type: 'circle',
        source: 'safety-incidents',
        minzoom: 11,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 14, 3.5, 17, 7],
          'circle-color': '#fb7185',
          'circle-stroke-color': '#09090b',
          'circle-stroke-width': 1,
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.3, 14, 0.7, 17, 0.9]
        }
      });

      map.on('mouseenter', 'safety-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'safety-points', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'safety-points', (event) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;
        const props = feature.properties || {};
        const content = document.createElement('div');
        content.className = 'p-3 bg-zinc-950 text-white space-y-1 max-w-64';
        const category = document.createElement('strong');
        category.className = 'block text-xs';
        category.textContent = props.category || 'Reported incident';
        const detail = document.createElement('p');
        detail.className = 'text-[11px] text-zinc-400';
        detail.textContent = [props.description, props.address].filter(Boolean).join(' · ');
        const date = document.createElement('p');
        date.className = 'text-[10px] text-zinc-500 font-mono';
        date.textContent = props.occurred_at ? new Date(props.occurred_at).toLocaleDateString() : '';
        content.append(category, detail, date);
        new maplibregl.Popup({ closeButton: false, offset: 8 })
          .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
          .setDOMContent(content)
          .addTo(map);
      });
    });

    return () => map.remove();
  }, [incidents, location.latitude, location.longitude]);

  return <div ref={container} className="h-[360px] w-full" aria-label="Reported crime incident heatmap" />;
}

export function SafetyHeatmap({ location }: { location: GeoLocation }) {
  const [data, setData] = useState<SafetyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({
      lat: String(location.latitude),
      lon: String(location.longitude),
      city: location.city,
      state: location.state
    });
    setData(null);
    setError(null);
    fetch(`/api/safety?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error || 'Safety data unavailable');
        return response.json();
      })
      .then(setData)
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      });
    return () => controller.abort();
  }, [location.city, location.latitude, location.longitude, location.state]);

  if (!data && !error) {
    return (
      <section className="h-48 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-xs text-zinc-400 font-mono">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading FBI safety context…
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-xs text-zinc-400 font-mono">
        <AlertTriangle className="w-4 h-4 text-amber-400 inline mr-2" />{error || 'Safety data unavailable'}
      </section>
    );
  }

  const comparison = data.state_vs_national_pct;
  const trend = data.year_over_year_pct;
  const latestViolent = data.violent_crime.find((point) => point.year === data.latest_year);
  const latestProperty = data.property_crime.find((point) => point.year === data.latest_year);

  return (
    <section className="rounded-xl border border-zinc-800/90 bg-zinc-950 overflow-hidden shadow-xl font-mono">
      <div className="p-5 border-b border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4 text-cyan-400" /> Crime &amp; Safety Context
              <span className="px-2 py-0.5 text-[9px] rounded border border-zinc-700 text-zinc-400">REPORTED DATA</span>
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-1">FBI state trend context with official street-level reports where municipal coverage exists.</p>
          </div>
          <span className="text-[10px] text-zinc-500">LATEST FBI YEAR: {data.latest_year || 'N/A'}</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="bg-black border border-zinc-900 rounded-lg p-3">
            <span className="text-[9px] text-zinc-500 block uppercase">Vs US rate</span>
            <strong className={comparison !== null && comparison > 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {comparison === null ? 'N/A' : `${comparison > 0 ? '+' : ''}${comparison}%`}
            </strong>
          </div>
          <div className="bg-black border border-zinc-900 rounded-lg p-3">
            <span className="text-[9px] text-zinc-500 block uppercase">Year over year</span>
            <strong className={`flex items-center gap-1 ${trend !== null && trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {trend !== null && trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend === null ? 'N/A' : `${trend > 0 ? '+' : ''}${trend}%`}
            </strong>
          </div>
          <div className="bg-black border border-zinc-900 rounded-lg p-3">
            <span className="text-[9px] text-zinc-500 block uppercase">Violent rate / month</span>
            <strong className="text-white">{latestViolent?.state_rate ?? 'N/A'}</strong>
          </div>
          <div className="bg-black border border-zinc-900 rounded-lg p-3">
            <span className="text-[9px] text-zinc-500 block uppercase">Property rate / month</span>
            <strong className="text-white">{latestProperty?.state_rate ?? 'N/A'}</strong>
          </div>
        </div>
      </div>

      {data.incidents.length > 0 ? (
        <div className="relative">
          <IncidentMap location={location} incidents={data.incidents} />
          <div className="absolute left-3 bottom-3 rounded-lg border border-zinc-800 bg-black/90 px-3 py-2 text-[10px] text-zinc-300 backdrop-blur-sm">
            <span className="font-bold text-white">{data.incidents.length} mapped reports</span>
            <span className="block text-zinc-500">Cyan → amber → rose indicates report density</span>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-black/40 text-sm text-zinc-400 font-sans">
          <p className="font-semibold text-white">Street-level heatmap unavailable for this municipality.</p>
          <p className="text-xs mt-1">{data.incident_coverage}</p>
        </div>
      )}

      <div className="px-5 py-3 border-t border-zinc-800 text-[10px] text-zinc-500 space-y-1">
        <p>{data.incident_source || data.source}</p>
        <p>{data.methodology}</p>
      </div>
    </section>
  );
}
