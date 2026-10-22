import {
  CURRENT_ERA,
  DEFAULT_NOMINATION_IDS,
  ERA_POINTS_WINDOW,
  NETWORK_NAME,
  SLASH_WINDOW_ERAS,
} from "@/lib/config";
import { totalFromFactors, weightedSetScore } from "@/lib/scoring";
import type {
  HistoryEvent,
  NetworkOverview,
  RewardBar,
  ScoreFactor,
  Validator,
  ValidatorDataProvider,
  ValidatorSource,
} from "@/lib/types";

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sparkline samples. Values are heights in a 20px line; they are not era points. */
function eraPoints(seed: number, floor: number, spread: number): number[] {
  const rand = mulberry32(seed);
  return Array.from({ length: ERA_POINTS_WINDOW }, () =>
    Math.round((floor + rand() * spread) * 10) / 10,
  );
}

function rewards(seed: number, slashIndexes: number[]): RewardBar[] {
  const rand = mulberry32(seed);
  return Array.from({ length: SLASH_WINDOW_ERAS }, (_, index) => {
    const slashed = slashIndexes.includes(index);
    const wave = 50 + Math.sin(index / 6) * 12;
    const value = slashed ? 18 : wave + rand() * 18;
    return { value: Math.round(value), slashed };
  });
}

interface Draft {
  id: string;
  name: string;
  ss58: string;
  h160: string;
  grade: Validator["grade"];
  score: number | null;
  commissionPercent: number;
  slashes: number;
  chills: number;
  activeEras: number;
  selfStake: number;
  stakeWeight: number;
  pointsSeed: number;
  pointsFloor: number;
  pointsSpread: number;
  rewardSeed: number;
  slashIndexes: number[];
  factors: ScoreFactor[];
  history: HistoryEvent[];
  scoreTx: string | null;
  /** Omitted rows stand in for mainnet-history scores. */
  source?: ValidatorSource;
}

function build(draft: Draft): Validator {
  return {
    id: draft.id,
    name: draft.name,
    ss58: draft.ss58,
    h160: draft.h160,
    grade: draft.grade,
    score: draft.score,
    commissionPercent: draft.commissionPercent,
    slashes: draft.slashes,
    chills: draft.chills,
    activeEras: draft.activeEras,
    selfStake: draft.selfStake,
    stakeWeight: draft.stakeWeight,
    active: true,
    eraPoints: eraPoints(draft.pointsSeed, draft.pointsFloor, draft.pointsSpread),
    rewards: rewards(draft.rewardSeed, draft.slashIndexes),
    factors: draft.factors,
    history: draft.history,
    scoreTx: draft.scoreTx,
    source: draft.source ?? "mainnet-history",
  };
}

const drafts: Draft[] = [
  {
    id: "lagos-validator",
    name: "Lagos Validator",
    ss58: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    h160: "0x11aa44c0b19e77d0aa11",
    grade: "A",
    score: 94,
    commissionPercent: 3,
    slashes: 0,
    chills: 0,
    activeEras: 420,
    selfStake: 80000,
    stakeWeight: 32,
    pointsSeed: 11,
    pointsFloor: 8,
    pointsSpread: 8,
    rewardSeed: 101,
    slashIndexes: [],
    factors: [
      { label: "Base score", points: 100 },
      { label: "Steady rewards for 84 eras", delta: 2 },
      { label: "Era points dipped in era 1,198", delta: -8 },
    ],
    history: [],
    scoreTx: "0xa11c90b21d44aa01c0e1",
  },
  {
    id: "ibadan-infra",
    name: "Ibadan Infra",
    ss58: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
    h160: "0x22bb18c04d77a091bb22",
    grade: "A",
    score: 91,
    commissionPercent: 5,
    slashes: 0,
    chills: 1,
    activeEras: 380,
    selfStake: 64000,
    stakeWeight: 32,
    pointsSeed: 22,
    pointsFloor: 8,
    pointsSpread: 8,
    rewardSeed: 202,
    slashIndexes: [],
    factors: [
      { label: "Base score", points: 100 },
      { label: "Chilled once in last 30 eras", delta: -3 },
      { label: "Short offline stretch in era 1,110", delta: -6 },
    ],
    history: [
      { id: "ibadan-chill", kind: "CHILL", summary: "Chilled", era: 1251 },
    ],
    scoreTx: "0xb22d44e018aa77c0bb22",
    // Stands in for one of the two validators in the testnet session set.
    source: "testnet-live",
  },
  {
    id: "abuja-secure",
    name: "Abuja Secure",
    ss58: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
    h160: "0x33cc90a14e22b801cc33",
    grade: "A",
    score: 88,
    commissionPercent: 2,
    slashes: 0,
    chills: 0,
    activeEras: 310,
    selfStake: 51000,
    stakeWeight: 32,
    pointsSeed: 33,
    pointsFloor: 7,
    pointsSpread: 8,
    rewardSeed: 303,
    slashIndexes: [],
    factors: [
      { label: "Base score", points: 100 },
      { label: "Era points below peers over 30 eras", delta: -14 },
      { label: "Steady rewards for 84 eras", delta: 2 },
    ],
    history: [],
    scoreTx: "0xc33e12f090bb44d0cc33",
  },
  {
    id: "okra-labs",
    name: "Okra Labs",
    ss58: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
    h160: "0x44dd12b80c55e091dd44",
    grade: "B",
    score: 72,
    commissionPercent: 5,
    slashes: 0,
    chills: 3,
    activeEras: 200,
    selfStake: 22000,
    stakeWeight: 20,
    pointsSeed: 44,
    pointsFloor: 6,
    pointsSpread: 9,
    rewardSeed: 404,
    slashIndexes: [],
    factors: [
      { label: "Base score", points: 100 },
      { label: "Chilled three times in last 30 eras", delta: -9 },
      { label: "Uneven era points", delta: -21 },
      { label: "Steady rewards for 84 eras", delta: 2 },
    ],
    history: [
      { id: "okra-1", kind: "CHILL", summary: "Chilled", era: 1240 },
      { id: "okra-2", kind: "CHILL", summary: "Chilled", era: 1255 },
      { id: "okra-3", kind: "CHILL", summary: "Chilled", era: 1271 },
    ],
    scoreTx: "0xd44a90c21e77bb10dd44",
  },
  {
    id: "kola-staking",
    name: "Kola Staking",
    ss58: "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL",
    h160: "0x8f2ab7c14e9033aa41c0",
    grade: "B",
    score: 67,
    commissionPercent: 7,
    slashes: 1,
    chills: 2,
    activeEras: 190,
    selfStake: 18000,
    stakeWeight: 18,
    pointsSeed: 55,
    pointsFloor: 6,
    pointsSpread: 8,
    rewardSeed: 505,
    slashIndexes: [20],
    factors: [
      { label: "Base score", points: 100 },
      { label: "Slashed once in era 412", delta: -25 },
      { label: "Chilled twice in last 30 eras", delta: -6 },
      { label: "Commission raised 5% → 7% in era 1,201", delta: -4 },
      { label: "Steady rewards for 84 eras", delta: 2 },
    ],
    history: [
      {
        id: "kola-com",
        kind: "COMMISSION",
        summary: "5% → 7%",
        era: 1201,
      },
      { id: "kola-chill-1", kind: "CHILL", summary: "Chilled", era: 1262 },
      { id: "kola-chill-2", kind: "CHILL", summary: "Chilled", era: 1270 },
      {
        id: "kola-slash",
        kind: "SLASH",
        summary: "0.5% of stake",
        era: 412,
      },
    ],
    scoreTx: "0x3a9c77b21044dde21b",
  },
  {
    id: "northstar-node",
    name: "NorthStar Node",
    ss58: "5GNJqTPyNqANBkUVMN1LPPrRuvrP4B8pJ7b5qH1sT9uV3wXy",
    h160: "0x55ee90c14a22d801ee55",
    grade: "C",
    score: 54,
    commissionPercent: 10,
    slashes: 0,
    chills: 4,
    activeEras: 140,
    selfStake: 15000,
    stakeWeight: 15,
    pointsSeed: 66,
    pointsFloor: 5,
    pointsSpread: 10,
    rewardSeed: 606,
    slashIndexes: [],
    factors: [
      { label: "Base score", points: 100 },
      { label: "Chilled four times in last 30 eras", delta: -12 },
      { label: "Commission sitting at 10%", delta: -10 },
      { label: "Unsteady era points", delta: -24 },
    ],
    history: [
      { id: "ns-1", kind: "CHILL", summary: "Chilled", era: 1220 },
      { id: "ns-2", kind: "CHILL", summary: "Chilled", era: 1244 },
      { id: "ns-3", kind: "CHILL", summary: "Chilled", era: 1260 },
      { id: "ns-4", kind: "CHILL", summary: "Chilled", era: 1276 },
    ],
    scoreTx: "0xe55b12a090cc77d0ee55",
  },
  {
    id: "delta-stake",
    name: "Delta Stake",
    ss58: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
    h160: "0x66ff14d80b33a091ff66",
    grade: "D",
    score: 38,
    commissionPercent: 15,
    slashes: 1,
    chills: 6,
    activeEras: 120,
    selfStake: 9000,
    stakeWeight: 8,
    pointsSeed: 77,
    pointsFloor: 4,
    pointsSpread: 11,
    rewardSeed: 707,
    slashIndexes: [48],
    factors: [
      { label: "Base score", points: 100 },
      { label: "Slashed once in era 900", delta: -25 },
      { label: "Chilled six times in last 30 eras", delta: -18 },
      { label: "Commission raised 10% → 15%", delta: -21 },
      { label: "Steady self-stake", delta: 2 },
    ],
    history: [
      {
        id: "delta-com",
        kind: "COMMISSION",
        summary: "10% → 15%",
        era: 1050,
      },
      { id: "delta-slash", kind: "SLASH", summary: "0.4% of stake", era: 900 },
      { id: "delta-1", kind: "CHILL", summary: "Chilled", era: 1248 },
      { id: "delta-2", kind: "CHILL", summary: "Chilled", era: 1264 },
      { id: "delta-3", kind: "CHILL", summary: "Chilled", era: 1275 },
    ],
    scoreTx: "0xf66190c21d88aa10ff66",
  },
  {
    id: "rogue-ops",
    name: "Rogue Ops",
    ss58: "5DfhGyQd3kL6nP8rT1vX4yZ7aC9eH2jM5pS8uW1yB4dG7k",
    h160: "0x7701ab44c0ee22107701",
    grade: "F",
    score: 12,
    commissionPercent: 25,
    slashes: 3,
    chills: 9,
    activeEras: 96,
    selfStake: 4000,
    stakeWeight: 4,
    pointsSeed: 88,
    pointsFloor: 1,
    pointsSpread: 16,
    rewardSeed: 808,
    slashIndexes: [12, 40, 60],
    factors: [
      { label: "Base score", points: 100 },
      { label: "Slashed three times, latest in era 1,090", delta: -63 },
      { label: "Chilled nine times in last 30 eras", delta: -18 },
      { label: "Commission raised to 25%", delta: -7 },
    ],
    history: [
      { id: "rogue-1", kind: "SLASH", summary: "1.2% of stake", era: 1090 },
      { id: "rogue-2", kind: "SLASH", summary: "0.8% of stake", era: 860 },
      { id: "rogue-3", kind: "SLASH", summary: "0.4% of stake", era: 640 },
      {
        id: "rogue-com",
        kind: "COMMISSION",
        summary: "10% → 25%",
        era: 1180,
      },
      { id: "rogue-chill", kind: "CHILL", summary: "Chilled", era: 1272 },
    ],
    scoreTx: "0x0771c4e090aa33d07701",
  },
  {
    id: "harmattan-node",
    name: "Harmattan Node",
    ss58: "5Ck5SLSH2mN7pQ9rT4vX8yA1cE6gJ3kM6pS9uW2yB5dH8",
    h160: "0x8802cc55d14aa0918802",
    grade: "NEW",
    score: null,
    commissionPercent: 4,
    slashes: 0,
    chills: 0,
    activeEras: 3,
    selfStake: 12000,
    stakeWeight: 2,
    pointsSeed: 99,
    pointsFloor: 9,
    pointsSpread: 3,
    rewardSeed: 909,
    slashIndexes: [],
    factors: [],
    history: [],
    scoreTx: null,
    // Stands in for one of the two validators in the testnet session set.
    source: "testnet-live",
  },
];

const validators: Validator[] = drafts.map(build);

function assertMock(list: Validator[]): void {
  for (const validator of list) {
    if (validator.eraPoints.length !== ERA_POINTS_WINDOW) {
      throw new Error(`${validator.id} era-point window length`);
    }
    if (validator.rewards.length !== SLASH_WINDOW_ERAS) {
      throw new Error(`${validator.id} reward window length`);
    }
    if (validator.score == null) {
      if (validator.grade !== "NEW") {
        throw new Error(`${validator.id} is unscored but graded ${validator.grade}`);
      }
      continue;
    }
    const total = totalFromFactors(validator.factors);
    if (total !== validator.score) {
      throw new Error(
        `${validator.id} factors total ${total}, published score ${validator.score}`,
      );
    }
  }

  const defaults = DEFAULT_NOMINATION_IDS.map((id) => {
    const validator = list.find((item) => item.id === id);
    if (!validator) throw new Error(`missing default nomination ${id}`);
    return validator;
  });
  const setScore = weightedSetScore(defaults);
  if (setScore !== 86) {
    throw new Error(`default nomination set scores ${setScore}, expected 86`);
  }
  const harmattan = list.find((validator) => validator.id === "harmattan-node");
  if (!harmattan || harmattan.grade !== "NEW" || harmattan.score != null) {
    throw new Error("harmattan-node should be an unscored NEW validator");
  }
  const withNew = weightedSetScore([...defaults, harmattan]);
  if (withNew !== 86) {
    throw new Error(`NEW validator changed the set score to ${withNew}`);
  }
  const live = list.filter((validator) => validator.source === "testnet-live");
  if (live.length !== 2) {
    throw new Error(`expected 2 testnet-live validators, found ${live.length}`);
  }
}

assertMock(validators);

const byId = new Map(validators.map((validator) => [validator.id, validator]));

const overview: NetworkOverview = {
  name: NETWORK_NAME,
  era: CURRENT_ERA,
  validatorsScored: 142,
  gradedA: 38,
  slashedLastWindow: 6,
  medianCommissionPercent: 5,
};

export const mockProvider: ValidatorDataProvider = {
  getOverview: async () => overview,
  listValidators: async () => validators,
  getValidator: async (id) => byId.get(id),
};
