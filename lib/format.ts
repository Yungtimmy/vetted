import { EXPLORER_URL, TESTNET_SUBSTRATE_RPC_URL } from "@/lib/config";

export function formatEra(era: number): string {
  return era.toLocaleString("en-US");
}

/** "12 of 28 eras recorded" */
export function erasRecorded(collected: number, needed: number): string {
  return `${collected} of ${needed} eras recorded`;
}

export function formatToken(amount: number, digits = 0): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatReward(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** "5Grwv…utQY" */
export function shortSs58(value: string): string {
  if (value.length <= 13) return value;
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}

/** "0x8f2a…41c0" */
export function shortHex(value: string): string {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `−${Math.abs(delta)}`;
}

export function parseBond(value: string): number {
  const amount = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

function explorerOrigin(): string {
  return EXPLORER_URL.replace(/\/$/, "");
}

/** Polkadot.js apps shell. Paths like /tx/{hash} return index.html. */
function isNodeConsole(origin: string): boolean {
  return origin.includes("node-console.portaldot.dev");
}

/**
 * Opens the block whose events include a ScorePublished log.
 * Scanner: hash route `#/blocks/{height}?tab=events` (a plain
 * `/blocks/{height}` path stays on the homepage).
 * Node console: `/?rpc=<v3 wss>#/explorer/query/{height}`.
 */
export function explorerBlockHref(blockNumber: number): string {
  const origin = explorerOrigin();
  if (!origin) return "/contract";
  if (isNodeConsole(origin)) {
    const rpc = encodeURIComponent(TESTNET_SUBSTRATE_RPC_URL);
    return `${origin}/?rpc=${rpc}#/explorer/query/${blockNumber}`;
  }
  return `${origin}/#/blocks/${blockNumber}?tab=events`;
}

/** Explorer home. The node console is pinned to the V3 testnet RPC. */
export function explorerHomeHref(): string {
  const origin = explorerOrigin();
  if (!origin) return "/contract";
  if (isNodeConsole(origin)) {
    const rpc = encodeURIComponent(TESTNET_SUBSTRATE_RPC_URL);
    return `${origin}/?rpc=${rpc}#/explorer`;
  }
  return origin;
}

/**
 * Explorer link for a published score.
 * Pass the block when it is known: neither the V3 scanner nor the node
 * console can open an EVM tx hash. Without a block, those two origins
 * stay on /contract instead of a dead /tx path.
 */
export function explorerTxHref(
  tx: string | null,
  blockNumber?: number | null,
): string {
  if (blockNumber != null && Number.isInteger(blockNumber) && blockNumber >= 0) {
    return explorerBlockHref(blockNumber);
  }
  const origin = explorerOrigin();
  if (!origin || !tx) return "/contract";
  if (
    isNodeConsole(origin) ||
    origin.includes("scanner-testnet-v3.portaldot.dev")
  ) {
    return "/contract";
  }
  return `${origin}/tx/${tx}`;
}

export function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
