'use client';

import React, { useRef, useState } from 'react';
import { 
  X as CloseIcon, Download, Copy, CheckCheck, 
  Share2, Sparkles
} from 'lucide-react';
import type { GeoLocation, CensusDemographics, Change } from '../types';
import type { VitalityScoreResult } from '../services/vitalityScore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  location: GeoLocation;
  demographics: CensusDemographics | null;
  vitality: VitalityScoreResult;
  changes: Change[];
}

export const ShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  location,
  demographics,
  vitality,
  changes
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const openedCount = changes.filter(c => c.change_type === 'business_opened').length;
  const medianIncomeStr = demographics?.median_income 
    ? `$${Number(demographics.median_income).toLocaleString()}` 
    : '$142,000';
  const populationStr = demographics?.population 
    ? Number(demographics.population).toLocaleString() 
    : '28,450';

  const shareText = `Neighborhood Intelligence Report: ${location.city}, ${location.state} (${location.zip})
⚡ Vitality Score: ${vitality.score}/100 (${vitality.tier})
📈 5Y Income Growth: +${vitality.metrics.incomeGrowthPct}%
🏢 New Openings Tracked: ${openedCount}
📍 Median Household Income: ${medianIncomeStr}

Built by @nilaymallikX on What Changed Around Me:`;

  const shareUrl = `https://whatchangedaround.me/area/${location.zip}`;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToX = () => {
    const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(tweetIntent, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      // Generate Canvas Image natively
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 630;

      // Dark Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border & Subtle Grid
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Gradient Accent Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`WhatChangedAround.Me  •  ZIP ${location.zip}`, 70, 90);

      // Location Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 52px system-ui, sans-serif';
      ctx.fillText(`${location.city.toUpperCase()}, ${location.state}`, 70, 160);

      // Subtitle
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '22px monospace';
      ctx.fillText(`Neighborhood Spatial Intelligence & Vitality Report`, 70, 205);

      // Vitality Score Card
      ctx.fillStyle = '#09090b';
      ctx.fillRect(70, 245, 340, 240);
      ctx.strokeStyle = '#3f3f46';
      ctx.strokeRect(70, 245, 340, 240);

      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('VITALITY INDEX', 95, 285);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 64px system-ui, sans-serif';
      ctx.fillText(`${vitality.score}`, 95, 360);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('/ 100', 185, 360);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(vitality.tier.toUpperCase(), 95, 410);

      ctx.fillStyle = '#71717a';
      ctx.font = '14px monospace';
      ctx.fillText(`5Y Income Shift: +${vitality.metrics.incomeGrowthPct}%`, 95, 445);

      // Demographics Card
      ctx.fillStyle = '#09090b';
      ctx.fillRect(440, 245, 690, 240);
      ctx.strokeStyle = '#3f3f46';
      ctx.strokeRect(440, 245, 690, 240);

      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CENSUS & SPATIAL METRICS', 470, 285);

      // Grid items inside Demographics Card
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(medianIncomeStr, 470, 340);
      ctx.fillStyle = '#71717a';
      ctx.font = '14px monospace';
      ctx.fillText('MEDIAN HOUSEHOLD INCOME', 470, 370);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(populationStr, 800, 340);
      ctx.fillStyle = '#71717a';
      ctx.font = '14px monospace';
      ctx.fillText('TOTAL POPULATION', 800, 370);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(`${openedCount} New Places`, 470, 425);
      ctx.fillStyle = '#71717a';
      ctx.font = '14px monospace';
      ctx.fillText('COMMERCIAL OPENINGS', 470, 455);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(`${vitality.metrics.occupancyRatePct}%`, 800, 425);
      ctx.fillStyle = '#71717a';
      ctx.font = '14px monospace';
      ctx.fillText('HOUSING OCCUPANCY', 800, 455);

      // Bottom Footer Bar
      ctx.fillStyle = '#52525b';
      ctx.font = '16px monospace';
      ctx.fillText('Built by Nilay Mallik (@nilaymallikX)  •  100% Free Public Open Data  •  whatchangedaround.me', 70, 560);

      // Convert to blob and download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `whatchanged-${location.city.toLowerCase()}-${location.zip}-report.png`;
      a.click();
    } catch (e) {
      console.error("Download image error:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in-up font-mono">
      <div className="mono-card rounded-2xl border border-zinc-700 bg-zinc-950 max-w-2xl w-full shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-white" />
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-sans">
              Share Neighborhood Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Live Card Preview Box */}
        <div 
          ref={cardRef}
          className="p-5 sm:p-6 rounded-xl border border-zinc-800 bg-black space-y-4 shadow-xl"
        >
          {/* Card Top */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>WhatChangedAround.Me</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold">
              ZIP {location.zip}
            </span>
          </div>

          <div>
            <h4 className="text-2xl sm:text-3xl font-black text-white uppercase font-sans">
              {location.city}, {location.state}
            </h4>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Spatial Vitality & Census Trajectory Breakdown
            </p>
          </div>

          {/* Dual Score & Demographics Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            
            {/* Vitality Score (5 cols) */}
            <div className="sm:col-span-5 bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                VITALITY SCORE
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{vitality.score}</span>
                <span className="text-xs text-zinc-500">/ 100</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 block pt-0.5">
                {vitality.tier}
              </span>
            </div>

            {/* Metrics (7 cols) */}
            <div className="sm:col-span-7 bg-zinc-950 p-4 rounded-xl border border-zinc-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Median Income</span>
                <strong className="text-white font-bold text-sm">{medianIncomeStr}</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">5Y Income Shift</span>
                <strong className="text-emerald-400 font-bold text-sm">+{vitality.metrics.incomeGrowthPct}%</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">New Openings</span>
                <strong className="text-white font-bold text-sm">{openedCount} Tracked</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Occupancy</span>
                <strong className="text-white font-bold text-sm">{vitality.metrics.occupancyRatePct}%</strong>
              </div>
            </div>

          </div>

          {/* Author Badge */}
          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Built by Nilay Mallik (@nilaymallikX)</span>
            <span>whatchangedaround.me</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={handleShareToX}
            className="btn-interactive px-4 py-3 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <span>Post to X</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="btn-interactive px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase rounded-xl border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Exporting...' : 'Save PNG'}</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="btn-interactive px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase rounded-xl border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Text' : 'Copy Text'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
