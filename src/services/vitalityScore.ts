import type { CensusDemographics, Change } from '../types';

export interface VitalityScoreResult {
  score: number; // 0 to 100
  tier: string;
  tierDescription: string;
  colorClass: string;
  breakdown: {
    incomeGrowthScore: number;    // max 35
    commercialVelocityScore: number; // max 30
    occupancyScore: number;       // max 20
    civicDensityScore: number;    // max 15
  };
  metrics: {
    incomeGrowthPct: number;
    openedCount: number;
    removedCount: number;
    modifiedCount: number;
    occupancyRatePct: number;
  };
}

export function calculateVitalityScore(
  demographics: CensusDemographics | null,
  changes: Change[]
): VitalityScoreResult {
  // 1. Income Growth Score (Max 35 points)
  let incomeGrowthPct = 5.2; // baseline sensible default
  if (demographics?.history_5y && demographics.history_5y.median_income > 0 && demographics.median_income > 0) {
    incomeGrowthPct = ((demographics.median_income - demographics.history_5y.median_income) / demographics.history_5y.median_income) * 100;
  } else if (demographics?.history_1y && demographics.history_1y.median_income > 0 && demographics.median_income > 0) {
    incomeGrowthPct = ((demographics.median_income - demographics.history_1y.median_income) / demographics.history_1y.median_income) * 100 * 3.5;
  }

  // Cap income score: 0% growth = 18 pts, >15% growth = 35 pts, negative growth scales down to 5 pts
  let incomeGrowthScore = Math.round(18 + (incomeGrowthPct * 1.15));
  incomeGrowthScore = Math.max(5, Math.min(35, incomeGrowthScore));

  // 2. Commercial Velocity Score (Max 30 points)
  const openedCount = changes.filter(c => c.change_type === 'business_opened').length;
  const removedCount = changes.filter(c => c.change_type === 'business_removed').length;
  const modifiedCount = changes.filter(c => c.change_type === 'business_modified').length;

  let velocityScore = 15;
  if (openedCount > 0 || removedCount > 0) {
    const netRatio = openedCount / Math.max(1, (openedCount + removedCount));
    velocityScore = Math.round(10 + (netRatio * 15) + Math.min(5, modifiedCount));
  }
  const commercialVelocityScore = Math.max(5, Math.min(30, velocityScore));

  // 3. Housing & Population Occupancy Score (Max 20 points)
  let occupancyRatePct = 88;
  if (demographics?.housing_units && demographics?.households && demographics.housing_units > 0) {
    occupancyRatePct = Math.min(100, Math.round((demographics.households / demographics.housing_units) * 100));
  }
  const occupancyScore = Math.round(Math.max(5, Math.min(20, (occupancyRatePct / 100) * 20)));

  // 4. Civic & Amenity Density Score (Max 15 points)
  const highSigCount = changes.filter(c => (c.significance_score || 0) >= 80).length;
  const civicDensityScore = Math.max(5, Math.min(15, 8 + Math.min(7, highSigCount * 1.5)));

  // Total Score (0 - 100)
  const totalScore = Math.round(incomeGrowthScore + commercialVelocityScore + occupancyScore + civicDensityScore);
  const score = Math.max(10, Math.min(99, totalScore));

  // Determine Tier
  let tier = 'Stable Commercial Core';
  let tierDescription = 'Consistent business presence and steady demographic baselines with moderate turnover.';
  let colorClass = 'text-zinc-200 border-zinc-500';

  if (score >= 88) {
    tier = 'High Expansion Corridor';
    tierDescription = 'Rapid commercial opening velocity accompanied by strong multi-year household income growth.';
    colorClass = 'text-emerald-400 border-emerald-500';
  } else if (score >= 76) {
    tier = 'Prime Commercial Core';
    tierDescription = 'Robust economic density, high housing occupancy, and frequent physical retail updates.';
    colorClass = 'text-white border-white';
  } else if (score >= 60) {
    tier = 'Emerging Cultural District';
    tierDescription = 'Active place updates and steady local investment across dining, retail, and civic spaces.';
    colorClass = 'text-zinc-300 border-zinc-600';
  } else {
    tier = 'Transitional District';
    tierDescription = 'Undergoing commercial reorganization with evolving neighborhood vacancy patterns.';
    colorClass = 'text-amber-400 border-amber-500';
  }

  return {
    score,
    tier,
    tierDescription,
    colorClass,
    breakdown: {
      incomeGrowthScore,
      commercialVelocityScore,
      occupancyScore,
      civicDensityScore
    },
    metrics: {
      incomeGrowthPct: Number(incomeGrowthPct.toFixed(1)),
      openedCount,
      removedCount,
      modifiedCount,
      occupancyRatePct
    }
  };
}
