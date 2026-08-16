'use client';

import React, { useState } from 'react';
import type { VitalityScoreResult } from '@/services/vitalityScore';

interface Props {
  vitality: VitalityScoreResult;
}

export const VitalityRadarChart: React.FC<Props> = ({ vitality }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 5 Radar Axes normalized to 0 - 100
  const axes = [
    {
      name: 'Commercial Velocity',
      shortName: 'Velocity',
      val: Math.min(100, Math.round((vitality.breakdown.commercialVelocityScore / 30) * 100)),
      detail: `${vitality.metrics.openedCount} new places opened vs ${vitality.metrics.removedCount} closed`
    },
    {
      name: 'Income Influx',
      shortName: 'Income',
      val: Math.min(100, Math.max(10, Math.round((vitality.breakdown.incomeGrowthScore / 35) * 100))),
      detail: `+${vitality.metrics.incomeGrowthPct}% 5-year household income growth`
    },
    {
      name: 'Housing Expansion',
      shortName: 'Housing',
      val: Math.min(100, Math.max(20, Math.round((vitality.breakdown.occupancyScore / 20) * 100))),
      detail: `${vitality.metrics.occupancyRatePct}% housing occupancy rate`
    },
    {
      name: 'Civic Density',
      shortName: 'Civic',
      val: Math.min(100, Math.max(30, Math.round((vitality.breakdown.civicDensityScore / 15) * 100))),
      detail: 'Schools, public parks, historic landmarks & civic anchors'
    },
    {
      name: 'Walk & Nightlife Index',
      shortName: 'Walk & Dining',
      val: Math.min(100, Math.max(25, Math.round(((vitality.metrics.openedCount + 2) / 6) * 100))),
      detail: 'Density of cafes, dining, and local commercial services'
    }
  ];

  const size = 260;
  const center = size / 2;
  const radius = 85;
  const totalAxes = axes.length;

  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const x = center + radius * valueRatio * Math.cos(angle);
    const y = center + radius * valueRatio * Math.sin(angle);
    return { x, y };
  };

  // Polygon points for the data
  const dataPoints = axes.map((axis, i) => {
    const { x, y } = getCoordinates(i, axis.val / 100);
    return `${x},${y}`;
  }).join(' ');

  // Grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-zinc-950 p-4 sm:p-5 rounded-xl border border-zinc-800/90 shadow-xl space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>5-AXIS VITALITY RADAR</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-bold uppercase">
          POLYGON INDEX
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* SVG Polygon Chart */}
        <div className="relative shrink-0">
          <svg width={size} height={size} className="overflow-visible">
            {/* Background Grid Polygons */}
            {gridLevels.map((level, lvlIdx) => {
              const pts = Array.from({ length: totalAxes }).map((_, i) => {
                const { x, y } = getCoordinates(i, level);
                return `${x},${y}`;
              }).join(' ');

              return (
                <polygon
                  key={lvlIdx}
                  points={pts}
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray={level < 1 ? '2 2' : 'none'}
                />
              );
            })}

            {/* Axis Radial Lines */}
            {axes.map((_, i) => {
              const { x, y } = getCoordinates(i, 1.0);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#3f3f46"
                  strokeWidth="1"
                />
              );
            })}

            {/* Data Polygon */}
            <polygon
              points={dataPoints}
              fill="rgba(16, 185, 129, 0.22)"
              stroke="#10b981"
              strokeWidth="2"
              className="transition-all duration-300"
            />

            {/* Vertex Dots */}
            {axes.map((axis, i) => {
              const { x, y } = getCoordinates(i, axis.val / 100);
              const isHovered = hoveredIndex === i;

              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill="#10b981"
                    stroke="#000"
                    strokeWidth="2"
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {/* Axis Label */}
                  {(() => {
                    const labelCoord = getCoordinates(i, 1.22);
                    return (
                      <text
                        x={labelCoord.x}
                        y={labelCoord.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={`text-[9px] font-mono uppercase font-bold transition-colors cursor-pointer ${
                          isHovered ? 'fill-emerald-400' : 'fill-zinc-400'
                        }`}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {axis.shortName}
                      </text>
                    );
                  })()}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Breakdown List */}
        <div className="space-y-1.5 w-full text-xs">
          {axes.map((axis, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-zinc-900 border-emerald-500/80 shadow-md'
                    : 'bg-black border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-white">{axis.name}</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">{axis.val}/100</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-sans mt-0.5">{axis.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
