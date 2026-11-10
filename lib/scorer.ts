import { ERA_POINTS_WINDOW, MIN_ERAS_TO_SCORE } from "@/lib/config";
import {
  CHILL_FULL_PENALTY_COUNT,
  COMMISSION_FREE_PERCENT,
  COMMISSION_FULL_PENALTY_PERCENT,
  SCORE_BASE,
  SCORE_WEIGHTS,
  SELF_STAKE_FULL_TOKENS,
  SLASH_FULL_PENALTY_COUNT,
} from "@/lib/scoring-config";
import { gradeForScore } from "@/lib/scoring";
import type { Grade, ScoreFactor } from "@/lib/types";

/**
 * v1 proposed, pending founder approval.
 *
 * Turns staking inputs into a 0-100 score and a factor breakdown.
 * This does not publish to ScoreRegistry. Scores already on that
 * contract were entered by hand; do not read them as output from here.
 */

export interface ScorerInput {
  /** Eras this validator has been active. Below MIN_ERAS_TO_SCORE the result is NEW. */
  activeEras: number;
  /**
   * Era points, oldest first. The scorer keeps the last ERA_POINTS_WINDOW
   * samples. An era counts as up when its points are greater than 0.
   * A shorter array leaves the missing eras down.
   */
  eraPoints: readonly number[];
  /** Current commission, in percent. 5 means 5%. */
  commissionPercent: number;
  /** Chill count inside the era-point window. Not the length of the history list. */
  chills: number;
  /** Slash count inside SLASH_WINDOW_ERAS. Not the length of the history list. */
  slashes: number;
  /** Self-stake in whole tokens, the same unit as Validator.selfStake. */
  selfStake: number;
}

export type ScoreResult =
  | {
      status: "new";
      grade: "NEW";
      score: null;
      factors: [];
    }
  | {
      status: "scored";
      grade: Exclude<Grade, "NEW">;
      score: number;
      factors: ScoreFactor[];
    };

export type BreakdownResult = ScoreResult | { status: "manual" };

interface PenaltyDraft {
  id: string;
  label: string;
  weight: number;
  raw: number;
  rawLabel: string;
  exact: number;
}

function requireFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
}

function requireCount(name: string, value: number): void {
  requireFinite(name, value);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a whole number of 0 or more`);
  }
}

/**
 * Integer shares of the exact deductions. The shares sum to
 * Math.round(sum(exact)). Ties on the fractional part go to the
 * earlier factor. Math.round uses half towards +∞.
 */
export function largestRemainder(exact: readonly number[]): number[] {
  const floors = exact.map((value) => Math.floor(value));
  const target = Math.round(exact.reduce((sum, value) => sum + value, 0));
  let leftover = target - floors.reduce((sum, value) => sum + value, 0);
  const ranked = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const shares = [...floors];
  for (const item of ranked) {
    if (leftover <= 0) break;
    shares[item.index] += 1;
    leftover -= 1;
  }
  if (leftover !== 0) {
    throw new Error("deduction rounding did not converge");
  }
  return shares;
}

function uptimeExact(eraPoints: readonly number[]): {
  raw: number;
  exact: number;
} {
  const window = eraPoints.slice(-ERA_POINTS_WINDOW);
  const up = window.filter((points) => points > 0).length;
  const shortfall = 1 - up / ERA_POINTS_WINDOW;
  return { raw: up, exact: SCORE_WEIGHTS.uptime * shortfall };
}

function commissionExact(percent: number): number {
  const span = COMMISSION_FULL_PENALTY_PERCENT - COMMISSION_FREE_PERCENT;
  const excess = Math.max(0, percent - COMMISSION_FREE_PERCENT);
  return SCORE_WEIGHTS.commission * Math.min(1, excess / span);
}

function countExact(count: number, fullCount: number, weight: number): number {
  return weight * Math.min(1, count / fullCount);
}

function selfStakeExact(tokens: number): number {
  const covered = Math.min(1, tokens / SELF_STAKE_FULL_TOKENS);
  return SCORE_WEIGHTS.selfStake * (1 - covered);
}

function formatTokens(tokens: number): string {
  return tokens.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPercent(percent: number): string {
  const digits = Number.isInteger(percent) ? 0 : 2;
  return `${percent.toFixed(digits)}%`;
}

export function scoreValidator(input: ScorerInput): ScoreResult {
  requireCount("activeEras", input.activeEras);
  requireCount("chills", input.chills);
  requireCount("slashes", input.slashes);
  requireFinite("commissionPercent", input.commissionPercent);
  requireFinite("selfStake", input.selfStake);
  if (input.commissionPercent < 0) {
    throw new Error("commissionPercent must be 0 or more");
  }
  if (input.selfStake < 0) {
    throw new Error("selfStake must be 0 or more");
  }
  for (const points of input.eraPoints) {
    requireFinite("eraPoints", points);
  }

  if (input.activeEras < MIN_ERAS_TO_SCORE) {
    return { status: "new", grade: "NEW", score: null, factors: [] };
  }

  const uptime = uptimeExact(input.eraPoints);
  const drafts: PenaltyDraft[] = [
    {
      id: "uptime",
      label: "Uptime",
      weight: SCORE_WEIGHTS.uptime,
      raw: uptime.raw,
      rawLabel: `${uptime.raw}/${ERA_POINTS_WINDOW}`,
      exact: uptime.exact,
    },
    {
      id: "slashes",
      label: "Slashes",
      weight: SCORE_WEIGHTS.slashes,
      raw: input.slashes,
      rawLabel: String(input.slashes),
      exact: countExact(
        input.slashes,
        SLASH_FULL_PENALTY_COUNT,
        SCORE_WEIGHTS.slashes,
      ),
    },
    {
      id: "chills",
      label: "Chills",
      weight: SCORE_WEIGHTS.chills,
      raw: input.chills,
      rawLabel: String(input.chills),
      exact: countExact(
        input.chills,
        CHILL_FULL_PENALTY_COUNT,
        SCORE_WEIGHTS.chills,
      ),
    },
    {
      id: "commission",
      label: "Commission",
      weight: SCORE_WEIGHTS.commission,
      raw: input.commissionPercent,
      rawLabel: formatPercent(input.commissionPercent),
      exact: commissionExact(input.commissionPercent),
    },
    {
      id: "selfStake",
      label: "Self-stake",
      weight: SCORE_WEIGHTS.selfStake,
      raw: input.selfStake,
      rawLabel: formatTokens(input.selfStake),
      exact: selfStakeExact(input.selfStake),
    },
  ];

  const shares = largestRemainder(drafts.map((draft) => draft.exact));
  const factors: ScoreFactor[] = [
    {
      id: "base",
      label: "Base score",
      weight: SCORE_BASE,
      raw: SCORE_BASE,
      rawLabel: String(SCORE_BASE),
      points: SCORE_BASE,
    },
    ...drafts.map((draft, index) => ({
      id: draft.id,
      label: draft.label,
      weight: draft.weight,
      raw: draft.raw,
      rawLabel: draft.rawLabel,
      points: shares[index] === 0 ? 0 : -shares[index],
    })),
  ];

  const score = factors.reduce((sum, factor) => sum + (factor.points ?? 0), 0);
  if (score < 0 || score > 100) {
    throw new Error(`score ${score} is outside 0-100`);
  }

  return {
    status: "scored",
    grade: gradeForScore(score),
    score,
    factors,
  };
}

/**
 * Live rows with stakingTracked false were published by hand.
 * The v1 weights are not applied to them.
 */
export function breakdownForValidator(
  validator: ScorerInput & { stakingTracked?: boolean },
): BreakdownResult {
  if (validator.stakingTracked === false) return { status: "manual" };
  return scoreValidator(validator);
}
