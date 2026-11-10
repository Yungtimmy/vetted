import { cacheLife } from "next/cache";
import { CURRENT_ERA, NETWORK_NAME } from "@/lib/config";
import { fetchPublishedScores, latestByValidator, type PublishedScore } from "@/lib/score-registry";
import { fetchActiveValidators, HIDDEN_VALIDATORS } from "@/lib/active-set";
import { buildStakingView, loadLiveStaking, type ChainStaking } from "@/lib/staking-inputs";
import { scoreValidator } from "@/lib/scorer";
import { gradeForScore } from "@/lib/scoring";
import { toSs58 } from "@/lib/ss58";
import type { Grade, NetworkOverview, ScoreFactor, Validator, ValidatorDataProvider } from "@/lib/types";

/** Dev accounts with known names. Others show their account id. */
const KNOWN_NAMES: Record<string, string> = {
  "0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48": "Bob",
};

const LETTER_GRADES: Grade[] = ["A", "B", "C", "D", "F"];

function toGrade(score: PublishedScore): Grade {
  const letter = score.grade.toUpperCase() as Grade;
  return LETTER_GRADES.includes(letter) ? letter : gradeForScore(score.score);
}

function chillLabel(factors: ScoreFactor[]): ScoreFactor[] {
  return factors.map((factor) =>
    factor.id === "chills" ? { ...factor, rawLabel: "not available on this chain" } : factor,
  );
}

/**
 * Published score stays the on-chain number. Factors are the v1 breakdown
 * from Substrate inputs for that score's era. stakingTracked stays false
 * when the node read fails, so the page keeps the hand-entered note alone.
 */
function toValidator(score: PublishedScore, chain: ChainStaking | null): Validator {
  const ss58 = toSs58(score.validator);
  const knownName = KNOWN_NAMES[score.validator];
  const base: Validator = {
    id: score.validator,
    name: knownName ?? ss58,
    hasIdentity: knownName != null,
    ss58,
    h160: score.validator,
    grade: toGrade(score),
    score: score.score,
    scoreEra: score.era,
    commissionPercent: 0,
    slashes: 0,
    chills: 0,
    activeEras: 0,
    selfStake: 0,
    stakeWeight: 1,
    active: true,
    eraPoints: [],
    rewards: [],
    factors: [],
    history: [],
    scoreTx: score.txHash,
    scoreBlock: score.blockNumber,
    source: "testnet-live",
    stakingTracked: false,
  };
  if (!chain) return base;
  try {
    const view = buildStakingView(chain, score.validator, score.era);
    const result = scoreValidator(view.input);
    const notes = [
      "Chills are not available on this chain. The row adds 0 points.",
    ];
    if (view.prunedEras.length > 0) {
      notes.push(
        `${view.prunedEras.length} eras in the uptime window are pruned and count as down.`,
      );
    }
    if (view.input.slashes === 0) {
      notes.push("No slash rows in ValidatorSlashInEra or UnappliedSlashes for this window.");
    }
    if (result.status !== "scored") {
      return {
        ...base,
        ...view.input,
        eraPoints: [...view.input.eraPoints],
        stakingTracked: true,
        scoreNotes: notes,
      };
    }
    return {
      ...base,
      commissionPercent: view.input.commissionPercent,
      slashes: view.input.slashes,
      chills: view.input.chills,
      activeEras: view.input.activeEras,
      selfStake: view.input.selfStake,
      eraPoints: [...view.input.eraPoints],
      factors: chillLabel(result.factors),
      stakingTracked: true,
      scoreNotes: notes,
    };
  } catch {
    return base;
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

async function loadValidators(): Promise<{ validators: Validator[]; currentEra: number | null }> {
  "use cache";
  cacheLife("minutes");
  const [logs, active] = await Promise.all([fetchPublishedScores(), fetchActiveValidators()]);
  const shown = active
    ? (key: string) => active.includes(key)
    : (key: string) => !HIDDEN_VALIDATORS.has(key);
  const published = latestByValidator(logs.filter((log) => shown(log.validator)));
  let chain: ChainStaking | null = null;
  try {
    if (published.length > 0) {
      chain = await loadLiveStaking(published.map((score) => score.validator));
    }
  } catch {
    chain = null;
  }
  const validators = published
    .map((score) => toValidator(score, chain))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return { validators, currentEra: chain?.currentEra ?? null };
}

export const liveProvider: ValidatorDataProvider = {
  async getOverview(): Promise<NetworkOverview> {
    const { validators, currentEra } = await loadValidators();
    const scored = validators.filter((validator) => validator.score != null);
    const publishedEra = Math.max(0, ...validators.map((validator) => validator.scoreEra ?? 0));
    const tracked = validators.some((validator) => validator.stakingTracked !== false);
    const commissions = validators
      .filter((validator) => validator.stakingTracked !== false)
      .map((validator) => validator.commissionPercent);
    return {
      name: NETWORK_NAME,
      era: currentEra || publishedEra || CURRENT_ERA,
      validatorsScored: scored.length,
      gradedA: scored.filter((validator) => validator.grade === "A").length,
      slashedLastWindow: validators.filter((validator) => validator.slashes > 0).length,
      medianCommissionPercent: median(commissions),
      stakingTracked: tracked,
    };
  },
  async listValidators() {
    return (await loadValidators()).validators;
  },
  async getValidator(id) {
    const { validators } = await loadValidators();
    return validators.find((validator) => validator.id === id.toLowerCase());
  },
};
