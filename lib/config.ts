/**
 * Chain settings.
 *
 * Portaldot has not confirmed the V3 testnet RPC or chain id, and the
 * previous wss endpoint is down. Live values come from NEXT_PUBLIC_
 * variables. The numbers in this file are unconfirmed placeholders used
 * only when the matching variable is unset. The same placeholders are
 * documented in `.env.example`.
 *
 * An H160 on this chain is a 20-byte account id. It is not an Ethereum
 * address.
 */

function envString(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** Whole number from env, or null when the variable is missing or invalid. */
function envInt(value: string | undefined): number | null {
  const raw = envString(value);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

/** Unconfirmed. Not a chain id Portaldot has published for V3. */
const FALLBACK_CHAIN_ID = 420420777;

/** Unconfirmed asset symbol. Report cards shorten this to tPOT. */
const FALLBACK_TOKEN_SYMBOL = "tPOTv3";

/** Unconfirmed decimal count for that asset. */
const FALLBACK_TOKEN_DECIMALS = 14;

const chainIdFromEnv = envInt(process.env.NEXT_PUBLIC_CHAIN_ID);

export const CHAIN_ID = chainIdFromEnv ?? FALLBACK_CHAIN_ID;

/** False when the UI is showing the unconfirmed placeholder chain id. */
export const CHAIN_ID_FROM_ENV = chainIdFromEnv != null;

const tokenSymbolFromEnv = envString(process.env.NEXT_PUBLIC_TOKEN_SYMBOL);

export const TOKEN_SYMBOL = tokenSymbolFromEnv || FALLBACK_TOKEN_SYMBOL;

export const TOKEN_SYMBOL_FROM_ENV = tokenSymbolFromEnv.length > 0;

const tokenDecimalsFromEnv = envInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS);

export const TOKEN_DECIMALS = tokenDecimalsFromEnv ?? FALLBACK_TOKEN_DECIMALS;

export const TOKEN_DECIMALS_FROM_ENV = tokenDecimalsFromEnv != null;

/**
 * Short label on report cards. The placeholder asset stays "tPOT".
 * A symbol set in the environment is shown as-is.
 */
export const TOKEN_DISPLAY_SYMBOL =
  TOKEN_SYMBOL === FALLBACK_TOKEN_SYMBOL ? "tPOT" : TOKEN_SYMBOL;

export const NETWORK_NAME = "Portaldot V3 testnet";

/** Era the mock provider reports. Live data will read this from the chain. */
export const CURRENT_ERA = 1284;

/**
 * A published score needs this many eras of history.
 * Newer validators stay NEW and are never graded F just for being new.
 */
export const MIN_ERAS_TO_SCORE = 28;

/**
 * Maximum validators in one nomination set.
 * This stays a code placeholder (not an env var) until the staking
 * pallet's nomination limit is read from the chain.
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

export const SUBSTRATE_RPC_URL = envString(
  process.env.NEXT_PUBLIC_SUBSTRATE_RPC_URL,
);

export const EVM_RPC_URL = envString(process.env.NEXT_PUBLIC_EVM_RPC_URL);

/** Explorer origin, no trailing slash. Empty until a deployment sets it. */
export const EXPLORER_URL = envString(process.env.NEXT_PUBLIC_EXPLORER_URL);

/**
 * True when a Substrate or EVM URL is set. The screens still render the
 * mock provider until that client is wired up.
 */
export const RPC_CONFIGURED =
  SUBSTRATE_RPC_URL.length > 0 || EVM_RPC_URL.length > 0;
