import {
  ERA_POINTS_WINDOW,
  MIN_ERAS_TO_SCORE,
  SLASH_WINDOW_ERAS,
} from "@/lib/config";
import type { Grade } from "@/lib/types";

/**
 * v1 proposed, pending founder approval.
 * Numeric parameters only. The hash in lib/scoring-hash.ts covers this object.
 * It is not a description of scores already stored in ScoreRegistry.
 */
export const FORMULA_VERSION = "v1";

/** Shown next to the weights in the app, the CLI, and SCORING.md. */
export const FORMULA_STATUS = "v1 proposed, pending founder approval";

export const SCORING_DOC_URL =
  "https://github.com/Yungtimmy/vetted/blob/main/SCORING.md";

/** First matching band wins. Keep these descending by minScore. */
export const GRADE_BANDS: readonly { grade: Exclude<Grade, "NEW">; minScore: number }[] =
  [
    { grade: "A", minScore: 85 },
    { grade: "B", minScore: 65 },
    { grade: "C", minScore: 50 },
    { grade: "D", minScore: 30 },
    { grade: "F", minScore: 0 },
  ];

/** Starting points. Penalty weights below sum to this, so a full penalty is 0. */
export const SCORE_BASE = 100;

/**
 * Max deduction for each input. v1 proposed, pending founder approval.
 * Slash is the largest weight: a slash takes nominator stake.
 */
export const SCORE_WEIGHTS = {
  uptime: 25,
  slashes: 40,
  chills: 15,
  commission: 15,
  selfStake: 5,
} as const;

/** No commission deduction at or below this percent. */
export const COMMISSION_FREE_PERCENT = 5;

/** Commission deduction reaches its full weight at or above this percent. */
export const COMMISSION_FULL_PENALTY_PERCENT = 20;

/** Chill deduction reaches its full weight at this count, and not before. */
export const CHILL_FULL_PENALTY_COUNT = 10;

/** Slash deduction reaches its full weight at this count, and not before. */
export const SLASH_FULL_PENALTY_COUNT = 3;

/** Self-stake, in whole tokens, that clears the self-stake deduction. */
export const SELF_STAKE_FULL_TOKENS = 50_000;

export const SCORING_CONFIG = {
  formulaVersion: FORMULA_VERSION,
  rollup: "base-minus-largest-remainder",
  scaleMin: 0,
  scaleMax: 100,
  base: SCORE_BASE,
  minErasToScore: MIN_ERAS_TO_SCORE,
  gradeBands: GRADE_BANDS.map((band) => ({
    grade: band.grade,
    minScore: band.minScore,
  })),
  eraPointsWindow: ERA_POINTS_WINDOW,
  slashWindowEras: SLASH_WINDOW_ERAS,
  factors: [
    { id: "uptime", weight: SCORE_WEIGHTS.uptime },
    {
      id: "slashes",
      weight: SCORE_WEIGHTS.slashes,
      fullPenaltyCount: SLASH_FULL_PENALTY_COUNT,
    },
    {
      id: "chills",
      weight: SCORE_WEIGHTS.chills,
      fullPenaltyCount: CHILL_FULL_PENALTY_COUNT,
    },
    {
      id: "commission",
      weight: SCORE_WEIGHTS.commission,
      freePercent: COMMISSION_FREE_PERCENT,
      fullPenaltyPercent: COMMISSION_FULL_PENALTY_PERCENT,
    },
    {
      id: "selfStake",
      weight: SCORE_WEIGHTS.selfStake,
      fullTokens: SELF_STAKE_FULL_TOKENS,
    },
  ],
} as const;

/** Object keys sorted at every level. Arrays keep the order in SCORING_CONFIG. */
export function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  throw new Error(`Cannot canonicalize ${typeof value}`);
}

export const SCORING_CONFIG_JSON = canonicalJson(SCORING_CONFIG);
