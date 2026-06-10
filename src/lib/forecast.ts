import { HEALTH, type Health } from "./constants";
import { clampPercent, monthProgress } from "./utils";

export interface ForecastInput {
  currentSales: number;
  target: number;
  month: number;
  year: number;
  now?: Date;
}

export interface ForecastResult {
  projectedSales: number;
  dailyAverage: number;
  requiredDailySales: number;
  expectedKpiPercent: number;
  currentPercent: number;
  completionLikelihood: number; // 0..1
  health: Health;
  remainingDays: number;
  elapsedDays: number;
}

/**
 * Forecast engine.
 *   Projected Sales = Current Sales + (Daily Average × Remaining Days)
 * Daily average is based on sales achieved over elapsed days so far.
 */
export function forecast(input: ForecastInput): ForecastResult {
  const { currentSales, target, month, year, now = new Date() } = input;
  const { elapsed, remaining } = monthProgress(month, year, now);

  const dailyAverage = elapsed > 0 ? currentSales / elapsed : 0;
  const projectedSales = currentSales + dailyAverage * remaining;

  const gap = Math.max(target - currentSales, 0);
  const requiredDailySales = remaining > 0 ? gap / remaining : gap;

  const currentPercent = target > 0 ? (currentSales / target) * 100 : 0;
  const expectedKpiPercent = target > 0 ? (projectedSales / target) * 100 : 0;

  // Likelihood: how the projection compares to target, smoothed to 0..1.
  const completionLikelihood =
    target > 0 ? Math.max(0, Math.min(projectedSales / target, 1)) : 1;

  return {
    projectedSales: Math.round(projectedSales),
    dailyAverage: Math.round(dailyAverage),
    requiredDailySales: Math.round(requiredDailySales),
    expectedKpiPercent: clampPercent(expectedKpiPercent),
    currentPercent: clampPercent(currentPercent),
    completionLikelihood,
    health: computeHealth(currentSales, target, month, year, now),
    remainingDays: remaining,
    elapsedDays: elapsed,
  };
}

/**
 * Performance health: compares achievement ratio to elapsed-time ratio.
 *   Green  = on or ahead of pace (achieved% >= elapsed% * 0.9)
 *   Amber  = somewhat behind     (>= elapsed% * 0.6)
 *   Red    = significantly behind
 */
export function computeHealth(
  currentSales: number,
  target: number,
  month: number,
  year: number,
  now = new Date(),
): Health {
  if (target <= 0) return HEALTH.GREEN;
  const { fraction } = monthProgress(month, year, now);
  const achievedRatio = currentSales / target;
  // Expected ratio at this point in the month equals elapsed fraction.
  const pace = fraction > 0 ? achievedRatio / fraction : achievedRatio;

  if (achievedRatio >= 1) return HEALTH.GREEN;
  if (pace >= 0.9) return HEALTH.GREEN;
  if (pace >= 0.6) return HEALTH.AMBER;
  return HEALTH.RED;
}
