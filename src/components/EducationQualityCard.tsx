'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, GraduationCap, Loader2, MapPin, School, Users } from 'lucide-react';
import type { EducationData, GeoLocation } from '@/types';

export function EducationQualityCard({ location }: { location: GeoLocation }) {
  const [data, setData] = useState<EducationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude) });
    setData(null);
    setError(null);
    fetch(`/api/schools?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error || 'School data unavailable');
        return response.json();
      })
      .then(setData)
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      });
    return () => controller.abort();
  }, [location.latitude, location.longitude]);

  if (!data && !error) {
    return (
      <section className="h-48 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-xs text-zinc-400 font-mono">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Querying nearby NCES schools…
      </section>
    );
  }

  if (error || !data) {
    return <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-xs text-zinc-400 font-mono">{error || 'School data unavailable'}</section>;
  }

  return (
    <section className="rounded-xl border border-zinc-800/90 bg-zinc-950 shadow-xl font-mono overflow-hidden">
      <div className="p-5 border-b border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-violet-400" /> School Access &amp; Education Resources
              <span className="px-2 py-0.5 text-[9px] rounded border border-zinc-700 text-zinc-400">NCES {data.school_year}</span>
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-1">Official public-school locations and administrative characteristics within 10 km.</p>
          </div>
          <div className="flex items-baseline gap-1 bg-black border border-zinc-800 rounded-lg px-3 py-2">
            <strong className="text-2xl text-white">{data.access_index}</strong>
            <span className="text-[10px] text-zinc-500">/100 ACCESS INDEX</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="bg-black p-3 rounded-lg border border-zinc-900">
            <School className="w-3.5 h-3.5 text-violet-400 mb-1" />
            <strong className="text-white block">{data.school_count}</strong>
            <span className="text-[9px] text-zinc-500 uppercase">Schools returned</span>
          </div>
          <div className="bg-black p-3 rounded-lg border border-zinc-900">
            <Users className="w-3.5 h-3.5 text-violet-400 mb-1" />
            <strong className="text-white block">{data.average_student_teacher_ratio ?? 'N/A'}:1</strong>
            <span className="text-[9px] text-zinc-500 uppercase">Average ratio</span>
          </div>
          <div className="hidden sm:block bg-black p-3 rounded-lg border border-zinc-900">
            <MapPin className="w-3.5 h-3.5 text-violet-400 mb-1" />
            <strong className="text-white block">10 km</strong>
            <span className="text-[9px] text-zinc-500 uppercase">Search radius</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
        {data.schools.slice(0, 6).map((school) => (
          <article key={school.nces_id} className="rounded-xl border border-zinc-800 bg-black p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-sans leading-snug">{school.name}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">{school.level} · Grades {school.grades}{school.charter ? ' · Charter' : ''}</p>
              </div>
              <span className="shrink-0 rounded-md border border-violet-900 bg-violet-950/40 px-2 py-1 text-[10px] font-bold text-violet-300">
                {school.resource_index}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div><span className="text-zinc-600 block">DISTANCE</span><strong className="text-zinc-300">{school.distance_km} km</strong></div>
              <div><span className="text-zinc-600 block">ENROLLMENT</span><strong className="text-zinc-300">{school.enrollment?.toLocaleString() ?? 'N/A'}</strong></div>
              <div><span className="text-zinc-600 block">STUDENT/TEACHER</span><strong className="text-zinc-300">{school.student_teacher_ratio ? `${school.student_teacher_ratio}:1` : 'N/A'}</strong></div>
            </div>
            <div className="flex items-end justify-between gap-2 border-t border-zinc-900 pt-2">
              <p className="text-[10px] text-zinc-500 font-sans leading-snug">{school.address}, {school.city}, {school.state} {school.zip}</p>
              <a
                href={`https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?Search=1&ID=${school.nces_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-300 hover:text-white shrink-0"
                aria-label={`Open NCES record for ${school.name}`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-zinc-800 text-[10px] text-zinc-500 space-y-1">
        <p>{data.source}</p>
        <p>{data.methodology}</p>
      </div>
    </section>
  );
}
