import {
  CHILL_WARN_THRESHOLD,
  ERA_POINTS_WINDOW,
  SLASH_WINDOW_ERAS,
} from "@/lib/config";
import type { Grade, ScoreFactor, Validator } from "@/lib/types";

/** Bands that match the sample set: 88+ A, 67 B, 54 C, 38 D, 12 F. */
export function gradeForScore(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

export function isRiskyGrade(grade: Grade): boolean {
  return grade === "D" || grade === "F";
}

export function totalFromFactors(factors: ScoreFactor[]): number {
  return factors.reduce(
    (sum, factor) => sum + (factor.points ?? factor.delta ?? 0),
    0,
  );
}

/** Stake-weighted mean of scored validators. NEW validators are skipped. */
export function weightedSetScore(validators: Validator[]): number | null {
  let weight = 0;
  let total = 0;
  for (const validator of validators) {
    if (validator.grade === "NEW" || validator.score == null) continue;
    weight += validator.stakeWeight;
    total += validator.score * validator.stakeWeight;
  }
  if (weight === 0) return null;
  return Math.round(total / weight);
}

export function averageCommission(validators: Validator[]): number | null {
  if (validators.length === 0) return null;
  const sum = validators.reduce(
    (total, validator) => total + validator.commissionPercent,
    0,
  );
  return sum / validators.length;
}

/**
 * Tuned so 500 tPOT at a set score of 86 estimates 2.4 tPOT per era.
 * The rate will come from the chain once rewards are wired up.
 */
export function estimateRewardPerEra(
  amount: number,
  score: number | null,
): number | null {
  if (score == null || !Number.isFinite(amount) || amount <= 0) return null;
  return amount * 0.0048 * (score / 86);
}

export interface SetFinding {
  tone: "ok" | "warn";
  text: string;
}

export function setFindings(selected: Validator[]): SetFinding[] {
  if (selected.length === 0) return [];
  const findings: SetFinding[] = [];
  const slashed = selected.filter((validator) => validator.slashes > 0);
  if (slashed.length === 0) {
    findings.push({
      tone: "ok",
      text: `No slashes in the last ${SLASH_WINDOW_ERAS} eras`,
    });
  } else {
    for (const validator of slashed) {
      const noun = validator.slashes === 1 ? "time" : "times";
      findings.push({
        tone: "warn",
        text: `${validator.name} slashed ${validator.slashes} ${noun}`,
      });
    }
  }

  const commission = averageCommission(selected);
  if (commission != null) {
    findings.push({
      tone: commission > 10 ? "warn" : "ok",
      text: `Average commission ${commission.toFixed(1)}%`,
    });
  }

  for (const validator of selected) {
    if (validator.chills >= CHILL_WARN_THRESHOLD) {
      findings.push({
        tone: "warn",
        text: `${validator.name} chilled ${validator.chills} times in ${ERA_POINTS_WINDOW} eras`,
      });
    }
  }

  return findings;
}

const WEAK_GRADES: Grade[] = ["C", "D", "F"];

export function headsUpMessage(validators: Validator[]): string | null {
  const weak = validators.filter((validator) =>
    WEAK_GRADES.includes(validator.grade),
  );
  if (weak.length === 0) return null;
  if (weak.length === 1) {
    const validator = weak[0];
    const detail =
      validator.chills > 0
        ? `${validator.chills} chill${validator.chills === 1 ? "" : "s"} in ${ERA_POINTS_WINDOW} eras`
        : validator.slashes > 0
          ? `${validator.slashes} slash${validator.slashes === 1 ? "" : "es"} on record`
          : "below a B";
    return `Heads up: ${validator.name} has a ${validator.grade} grade (${detail}).`;
  }
  const list = weak
    .map((validator) => `${validator.name} (${validator.grade})`)
    .join(", ");
  return `Heads up: ${list} sit below a B.`;
}
