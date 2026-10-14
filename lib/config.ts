/**
 * Chain and product constants.
 *
 * The UI does not call a node yet. These are the values a live client
 * will use: Portaldot V3 testnet, chain id 420420777, token tPOTv3 with
 * 14 decimals. An H160 on this chain is a 20-byte account id. It is not
 * an Ethereum address.
 */

export const CHAIN_ID = 420420777;

export const NETWORK_NAME = "Portaldot V3 testnet";

/** Era the mock provider reports. Live data will read this from the chain. */
export const CURRENT_ERA = 1284;

/** Canonical asset symbol on the testnet. */
export const TOKEN_SYMBOL = "tPOTv3";

/** Short label used on report cards. */
export const TOKEN_DISPLAY_SYMBOL = "tPOT";

export const TOKEN_DECIMALS = 14;

/**
 * A published score needs this many eras of history.
 * Newer validators stay NEW and are never graded F just for being new.
 */
export const MIN_ERAS_TO_SCORE = 28;

/**
 * Maximum validators in one nomination set.
 * Placeholder until the staking pallet's nomination limit is read.
 */
export const NOMINATION_CAP = 16;

/** Window for slash counts and the rewards chart. */
export const SLASH_WINDOW_ERAS = 84;

/** Window for the era-point sparkline and chill counts. */
export const ERA_POINTS_WINDOW = 30;

/** Chill count at or above this draws a warning on a nomination set. */
export const CHILL_WARN_THRESHOLD = 2;

/** Stand-in spendable balance, in whole tokens, until a wallet is connected. */
export const MOCK_SPENDABLE_TOKENS = 2450;

/** Default bond on the nominate screen, in whole tokens. */
export const DEFAULT_BOND_TOKENS = 500;

/** Placeholder tx shown after the mock wallet signature. Not broadcast. */
export const MOCK_NOMINATION_TX = "0x7be14cd290af";

/** Pre-selected validators on the nominate screen. */
export const DEFAULT_NOMINATION_IDS = [
  "lagos-validator",
  "ibadan-infra",
  "abuja-secure",
  "northstar-node",
] as const;

export const SUBSTRATE_RPC_URL = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_URL ?? "";

export const EVM_RPC_URL = process.env.NEXT_PUBLIC_EVM_RPC_URL ?? "";

/** Explorer origin, no trailing slash. Empty until a deployment sets it. */
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "";
