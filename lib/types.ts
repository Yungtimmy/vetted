export type Grade = "A" | "B" | "C" | "D" | "F" | "NEW";

/**
 * Mainnet history: a score built from mainnet eras and published on the
 * testnet contract. Testnet live: a validator in the testnet session set.
 */
export type ValidatorSource = "mainnet-history" | "testnet-live";

export const VALIDATOR_SOURCE_LABEL: Record<ValidatorSource, string> = {
  "mainnet-history": "Mainnet history",
  "testnet-live": "Testnet",
};

export type HistoryKind = "COMMISSION" | "CHILL" | "SLASH";

/** One line in the "why this score" breakdown. */
export interface ScoreFactor {
  label: string;
  /** Absolute points. Set on the base row. */
  points?: number;
  /** Signed point change. Set on every row except the base. */
  delta?: number;
}

export interface HistoryEvent {
  id: string;
  kind: HistoryKind;
  summary: string;
  era: number;
}

export interface RewardBar {
  value: number;
  slashed: boolean;
}

export interface Validator {
  id: string;
  name: string;
  /** SS58 account id. */
  ss58: string;
  /** False when the name is just the address (no on-chain identity). */
  hasIdentity?: boolean;
  /**
   * 20-byte Portaldot account id, 0x-prefixed hex.
   * This is not an Ethereum address.
   */
  h160: string;
  grade: Grade;
  /** Null until the validator has MIN_ERAS_TO_SCORE eras of history. */
  score: number | null;
  /** Era the latest score was published for, when known. */
  scoreEra?: number;
  commissionPercent: number;
  /** Slashes inside the slash window. */
  slashes: number;
  /** Chills inside the era-point window. */
  chills: number;
  /** Eras this validator has been active. */
  activeEras: number;
  /** Self-stake in whole tokens. The chain value has TOKEN_DECIMALS. */
  selfStake: number;
  /** Relative weight for a nomination set's stake-weighted score. */
  stakeWeight: number;
  active: boolean;
  /** Era points for the sparkline, oldest first. Higher sits higher on the line. */
  eraPoints: number[];
  /** Reward index for the rewards chart, oldest first. */
  rewards: RewardBar[];
  factors: ScoreFactor[];
  history: HistoryEvent[];
  /** Transaction that published the latest score, when one exists. */
  scoreTx: string | null;
  /** Block that contains scoreTx. The explorer opens this block's events. */
  scoreBlock?: number | null;
  /** Where this row's history comes from. */
  source: ValidatorSource;
  /**
   * False when commission, slashes, chills, and rewards are not read from
   * the chain yet. Screens show "Not tracked yet" instead of zeros.
   */
  stakingTracked?: boolean;
}

export interface NetworkOverview {
  name: string;
  era: number;
  validatorsScored: number;
  gradedA: number;
  slashedLastWindow: number;
  medianCommissionPercent: number;
  /** False when slash and commission totals are not read from the chain yet. */
  stakingTracked?: boolean;
}

/**
 * The read API pages depend on.
 * A Substrate provider and an EVM score-contract provider can implement
 * this later without changing the screens.
 */
export interface ValidatorDataProvider {
  getOverview(): Promise<NetworkOverview>;
  listValidators(): Promise<Validator[]>;
  getValidator(id: string): Promise<Validator | undefined>;
}
