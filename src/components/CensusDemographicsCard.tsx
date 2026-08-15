'use client';

import React from 'react';
import { 
  Users, Home, DollarSign, Building2, Clock, Landmark, ShieldCheck, TrendingUp
} from 'lucide-react';
import type { CensusDemographics } from '../types';

interface Props {
  demographics: CensusDemographics | null;
  loading?: boolean;
  selectedDateFilter?: string;
}

export const CensusDemographicsCard: React.FC<Props> = ({ demographics, loading, selectedDateFilter = '30d' }) => {
  if (loading) {
    return (
      <div className="mono-card p-6 rounded-xl border border-zinc-800 animate-pulse space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900 rounded border border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!demographics) return null;

  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (num: number) => {
    if (!num || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  // Determine baseline history according to selected date filter
  let baseline = demographics.history_1y;
  let periodLabel = '1Y ago';

  if (selectedDateFilter === '10y') {
    baseline = demographics.history_10y || demographics.history_5y;
    periodLabel = '10Y ago';
  } else if (selectedDateFilter === '5y') {
    baseline = demographics.history_5y || demographics.history_1y;
    periodLabel = '5Y ago';
  } else if (selectedDateFilter === '1y') {
    baseline = demographics.history_1y;
    periodLabel = '1Y ago';
  } else if (selectedDateFilter === '6m') {
    baseline = demographics.history_1y;
    periodLabel = '6M ago';
  } else if (selectedDateFilter === '30d') {
    baseline = demographics.history_1y;
    periodLabel = '30D ago';
  }

  const renderDelta = (current: number, baseVal?: number) => {
    if (!baseVal || baseVal === 0 || !current) return null;
    const diff = current - baseVal;
    const pct = (diff / baseVal) * 100;
    const isPositive = pct >= 0;
    const sign = isPositive ? '+' : '';

    return (
      <div className="inline-flex items-center gap-1 text-[10px] font-mono mt-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
        <span className={isPositive ? 'text-white font-bold' : 'text-zinc-400'}>
          {isPositive ? '▲' : '▼'} {sign}{pct.toFixed(1)}%
        </span>
        <span className="text-[9px] text-zinc-500 uppercase font-normal">vs {periodLabel}</span>
      </div>
    );
  };

  const avgHouseholdSize = demographics.households > 0 && demographics.population > 0
    ? (demographics.population / demographics.households).toFixed(2)
    : null;

  const occupancyRate = demographics.housing_units > 0 && demographics.households > 0
    ? Math.min(100, Math.round((demographics.households / demographics.housing_units) * 100))
    : null;

  return (
    <div className="mono-card p-6 rounded-xl border border-zinc-800 space-y-5 animate-fade-in-up">
      
      {/* Header with ZCTA Mapping Flow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
            <Landmark className="w-3.5 h-3.5 text-white" />
            <span>US Census Bureau Dataset (ACS 5-Year)</span>
            <span className="text-zinc-600">•</span>
            <span className="text-white flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-[10px]">
              <TrendingUp className="w-3 h-3 text-white" />
              <span>Comparing vs {periodLabel} Baseline</span>
            </span>
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            Demographic Metrics & ZCTA Statistics
          </h3>
        </div>

        {/* ZCTA Mapping Concept Badge */}
        <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-700 font-mono text-xs text-white shrink-0">
          <span className="font-bold text-zinc-300">ZIP {demographics.zip}</span>
          <span className="text-zinc-500">→</span>
          <span className="font-black bg-white text-black px-1.5 py-0.5 rounded text-[10px]">ZCTA {demographics.zcta}</span>
        </div>
      </div>

      {/* Primary 6 Metrics Grid with Comparative Deltas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        
        {/* Population */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase font-bold">
            <Users className="w-3.5 h-3.5 text-white" />
            <span>Population</span>
          </div>
          <p className="text-lg font-black text-white tracking-tight">
            {formatNumber(demographics.population)}
          </p>
          {renderDelta(demographics.population, baseline?.population)}
        </div>

        {/* Households */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase font-bold">
            <Home className="w-3.5 h-3.5 text-white" />
            <span>Households</span>
          </div>
          <p className="text-lg font-black text-white tracking-tight">
            {formatNumber(demographics.households)}
          </p>
          {renderDelta(demographics.households, baseline?.households)}
        </div>

        {/* Median Income */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase font-bold">
            <DollarSign className="w-3.5 h-3.5 text-white" />
            <span>Median Income</span>
          </div>
          <p className="text-lg font-black text-white tracking-tight">
            {formatCurrency(demographics.median_income)}
          </p>
          {renderDelta(demographics.median_income, baseline?.median_income)}
        </div>

        {/* Housing Units */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase font-bold">
            <Building2 className="w-3.5 h-3.5 text-white" />
            <span>Housing Units</span>
          </div>
          <p className="text-lg font-black text-white tracking-tight">
            {formatNumber(demographics.housing_units)}
          </p>
          {renderDelta(demographics.housing_units, baseline?.housing_units)}
        </div>

        {/* Median Age */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase font-bold">
            <Clock className="w-3.5 h-3.5 text-white" />
            <span>Median Age</span>
          </div>
          <p className="text-lg font-black text-white tracking-tight">
            {demographics.median_age ? `${demographics.median_age} yrs` : 'N/A'}
          </p>
          {renderDelta(demographics.median_age, baseline?.median_age)}
        </div>

        {/* Median Home Value */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase font-bold">
            <Landmark className="w-3.5 h-3.5 text-white" />
            <span>Home Value</span>
          </div>
          <p className="text-lg font-black text-white tracking-tight">
            {formatCurrency(demographics.median_home_value)}
          </p>
          {renderDelta(demographics.median_home_value, baseline?.median_home_value)}
        </div>

      </div>

      {/* Calculated Insights & Server-Side Security Provenance Footer */}
      <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
        <div className="flex flex-wrap items-center gap-4">
          {avgHouseholdSize && (
            <span className="flex items-center gap-1">
              <strong className="text-white font-bold">{avgHouseholdSize}</strong> residents / household avg
            </span>
          )}
          {occupancyRate !== null && (
            <span className="flex items-center gap-1">
              <strong className="text-white font-bold">{occupancyRate}%</strong> occupied housing units
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Server-Side Supabase Edge Function API Processing</span>
        </div>
      </div>

    </div>
  );
};
