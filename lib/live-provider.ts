import { CURRENT_ERA, MIN_ERAS_TO_SCORE, NETWORK_NAME } from "@/lib/config";
import { fetchPublishedScores, latestByValidator, type PublishedScore } from "@/lib/score-registry";
import { fetchActiveValidators, HIDDEN_VALIDATORS } from "@/lib/active-set";
import { gradeForScore } from "@/lib/scoring";
import { toSs58 } from "@/lib/ss58";
import type { Grade, NetworkOverview, Validator, ValidatorDataProvider } from "@/lib/types";

/** Dev accounts with known names. Others show their account id. */
const KNOWN_NAMES: Record<string, string> = {
  "0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48": "Bob",
};

const LETTER_GRADES: Grade[] = ["A", "B", "C", "D", "F"];

function toGrade(score: PublishedScore): Grade {
  const letter = score.grade.toUpperCase() as Grade;
  return LETTER_GRADES.includes(letter) ? letter : gradeForScore(score.score);
}

/**
 * A score-registry row. Staking fields (commission, chills, slashes,
 * stake, era points) come from the Substrate side, which is not read
 * yet, so they stay at zero or empty.
 */
function toValidator(score: PublishedScore): Validator {
  const ss58 = toSs58(score.validator);
  const knownName = KNOWN_NAMES[score.validator];
  return {
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
    activeEras: MIN_ERAS_TO_SCORE,
    selfStake: 0,
    stakeWeight: 1,
    active: true,
    eraPoints: [],
    rewards: [],
    factors: [{ label: `Published score, era ${score.era}`, points: score.score }],
    history: [],
    scoreTx: score.txHash,
    source: "testnet-live",
    stakingTracked: false,
  };
}

async function loadValidators(): Promise<Validator[]> {
  const [logs, active] = await Promise.all([fetchPublishedScores(), fetchActiveValidators()]);
  const shown = active
    ? (key: string) => active.includes(key)
    : (key: string) => !HIDDEN_VALIDATORS.has(key);
  return latestByValidator(logs.filter((log) => shown(log.validator)))
    .map(toValidator)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

export const liveProvider: ValidatorDataProvider = {
  async getOverview(): Promise<NetworkOverview> {
    const validators = await loadValidators();
    const scored = validators.filter((validator) => validator.score != null);
    const era = Math.max(0, ...validators.map((validator) => validator.scoreEra ?? 0));
    return {
      name: NETWORK_NAME,
      era: era || CURRENT_ERA,
      validatorsScored: scored.length,
      gradedA: scored.filter((validator) => validator.grade === "A").length,
      slashedLastWindow: 0,
      medianCommissionPercent: 0,
      stakingTracked: false,
    };
  },
  listValidators: loadValidators,
  async getValidator(id) {
    const validators = await loadValidators();
    return validators.find((validator) => validator.id === id.toLowerCase());
  },
};
