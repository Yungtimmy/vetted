/**
 * Chain settings.
 *
 * Portaldot published the V3 testnet endpoints. Chain id, token, and
 * RPC URLs are read from NEXT_PUBLIC_ variables. The values in this
 * file are the confirmed defaults used only when the matching variable
 * is unset. `.env.example` documents the same endpoints.
 *
 * SS58 prefix and era timing are chain facts, not env vars.
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

/** Confirmed V3 testnet chain id. Used when NEXT_PUBLIC_CHAIN_ID is unset. */
const FALLBACK_CHAIN_ID = 420420777;

/** Confirmed asset symbol (`system_properties.tokenSymbol`). */
const FALLBACK_TOKEN_SYMBOL = "tPOT";

/** Confirmed decimal count (`system_properties.tokenDecimals`). */
const FALLBACK_TOKEN_DECIMALS = 14;

const chainIdFromEnv = envInt(process.env.NEXT_PUBLIC_CHAIN_ID);

export const CHAIN_ID = chainIdFromEnv ?? FALLBACK_CHAIN_ID;

/** False when the UI is using the confirmed fallback chain id. */
export const CHAIN_ID_FROM_ENV = chainIdFromEnv != null;

const tokenSymbolFromEnv = envString(process.env.NEXT_PUBLIC_TOKEN_SYMBOL);

export const TOKEN_SYMBOL = tokenSymbolFromEnv || FALLBACK_TOKEN_SYMBOL;

export const TOKEN_SYMBOL_FROM_ENV = tokenSymbolFromEnv.length > 0;

const tokenDecimalsFromEnv = envInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS);

export const TOKEN_DECIMALS = tokenDecimalsFromEnv ?? FALLBACK_TOKEN_DECIMALS;

export const TOKEN_DECIMALS_FROM_ENV = tokenDecimalsFromEnv != null;

/** Label on report cards. The confirmed symbol is already short. */
export const TOKEN_DISPLAY_SYMBOL = TOKEN_SYMBOL;

/** `system_chain` on the V3 testnet node. */
export const CHAIN_NAME = "PortaldotV3 Test";

export const NETWORK_NAME = CHAIN_NAME;

/** SS58 address prefix (`system_properties.ss58Format`). */
export const SS58_PREFIX = 42;

/** Target block time, in seconds. */
export const BLOCK_TIME_SECONDS = 6;

/** Blocks in one session. */
export const SESSION_BLOCKS = 600;

/** Sessions in one era. Six of these at 6s is about 6 hours. */
export const SESSIONS_PER_ERA = 6;

/** 6 × 600 × 6 seconds. */
export const ERA_DURATION_SECONDS =
  BLOCK_TIME_SECONDS * SESSION_BLOCKS * SESSIONS_PER_ERA;

export const ERA_DURATION_HOURS = ERA_DURATION_SECONDS / 3600;

/** Eras of history the node retains. */
export const HISTORY_DEPTH_ERAS = 84;

/** Era the mock provider reports. Live data will read this from the chain. */
export const CURRENT_ERA = 1284;

/**
 * A published score needs this many eras of history.
 * Newer validators stay NEW and are never graded F just for being new.
 */
export const MIN_ERAS_TO_SCORE = 28;

/**
 * Maximum validators in one nomination set.
 * The staking pallet does not publish MaxNominations. This stays 16
 * until a limit is read from the chain. It is not an env var.
 */
export const NOMINATION_CAP = 16;

/** Slash counts and the rewards chart use the chain history depth. */
export const SLASH_WINDOW_ERAS = HISTORY_DEPTH_ERAS;

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

/** Confirmed V3 testnet Substrate endpoint. Node-console deep links use it. */
export const TESTNET_SUBSTRATE_RPC_URL = "wss://test-node-v3.portaldot.dev";

/** Confirmed V3 testnet EVM JSON-RPC. Used when NEXT_PUBLIC_EVM_RPC_URL is unset. */
const FALLBACK_EVM_RPC_URL = "https://test-evm-rpc-v3.portaldot.dev";

export const EVM_RPC_URL =
  envString(process.env.NEXT_PUBLIC_EVM_RPC_URL) || FALLBACK_EVM_RPC_URL;

/** ScoreRegistry on the V3 testnet. Used when NEXT_PUBLIC_SCORE_REGISTRY_ADDRESS is unset. */
const FALLBACK_SCORE_REGISTRY_ADDRESS =
  "0xeebc363c7af7ed8e888da07e959043517ae4b97d";

export const SCORE_REGISTRY_ADDRESS = (
  envString(process.env.NEXT_PUBLIC_SCORE_REGISTRY_ADDRESS) ||
  FALLBACK_SCORE_REGISTRY_ADDRESS
).toLowerCase();

/** Block the registry was deployed in. Log reads start here. */
const FALLBACK_SCORE_REGISTRY_FROM_BLOCK = 107303;

export const SCORE_REGISTRY_FROM_BLOCK =
  envInt(process.env.NEXT_PUBLIC_SCORE_REGISTRY_FROM_BLOCK) ??
  FALLBACK_SCORE_REGISTRY_FROM_BLOCK;

/**
 * "live" reads ScorePublished logs from the registry. "mock" keeps the
 * sample validators for design work.
 */
export const DATA_SOURCE: "live" | "mock" =
  envString(process.env.NEXT_PUBLIC_DATA_SOURCE) === "mock" ? "mock" : "live";

/** The EVM RPC rejects requests without a User-Agent. */
export const RPC_USER_AGENT = "vetted/0.1 (+https://github.com/Yungtimmy/vetted)";

/**
 * V3 testnet scanner. `#/blocks/{height}?tab=events` opens the block that
 * contains a ScorePublished log. A path without the hash stays on the
 * homepage. The node console is an SPA: `/tx/{hash}` is not a transaction page.
 */
const FALLBACK_EXPLORER_URL = "https://scanner-testnet-v3.portaldot.dev";

const explorerFromEnv = envString(process.env.NEXT_PUBLIC_EXPLORER_URL);

/** False when the UI is using the scanner default above. */
export const EXPLORER_URL_FROM_ENV = explorerFromEnv.length > 0;

/** Explorer origin, no trailing slash. */
export const EXPLORER_URL = explorerFromEnv || FALLBACK_EXPLORER_URL;

/**
 * Era-39 ScorePublished transactions on ScoreRegistry.
 * Both validators are in the testnet active set. These are the first era.
 * Era 64 publishes are cited in the README and are not linked from this page.
 */
export const ERA39_PUBLISHES = [
  {
    block: 144339,
    tx: "0x76a7bd7259f660c546c1532a46ba79d353e1df5121d11fbcc8838f836c969dcf",
    validator: "0x849a279f6c2ad8f0a66953cb89bdeff513b1a4ded437e41cb7dbd69726176b0c",
    era: 39,
    score: 100,
    grade: "A",
  },
  {
    block: 144343,
    tx: "0xf197cb76814284676fb41ee3cad7e07452a309adab6f1a1616608d41de6e874d",
    validator: "0xd40a5b57ee622816c3cf13cfb58bbb44c60b2b03f9fc838386816aea05b0ac47",
    era: 39,
    score: 100,
    grade: "A",
  },
] as const;

/** True when scores come from the chain rather than the sample set. */
export const RPC_CONFIGURED = DATA_SOURCE === "live";
