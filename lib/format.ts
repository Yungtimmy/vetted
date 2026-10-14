import { EXPLORER_URL } from "@/lib/config";

export function formatEra(era: number): string {
  return era.toLocaleString("en-US");
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

/** "5GrwvaEF…utQY" */
export function shortSs58(value: string): string {
  if (value.length <= 13) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
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

/**
 * Explorer link for a published score or nomination tx.
 * Falls back to the API page while NEXT_PUBLIC_EXPLORER_URL is unset.
 */
export function explorerTxHref(tx: string | null): string {
  if (!EXPLORER_URL || !tx) return "/contract";
  return `${EXPLORER_URL.replace(/\/$/, "")}/tx/${tx}`;
}

export function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
