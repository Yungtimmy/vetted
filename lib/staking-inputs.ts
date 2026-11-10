import {
  ERA_POINTS_WINDOW,
  HISTORY_DEPTH_ERAS,
  SLASH_WINDOW_ERAS,
  TOKEN_DECIMALS,
} from "@/lib/config";
import type { ScorerInput } from "@/lib/scorer";
import {
  blake128ConcatKey,
  httpChainStorage,
  prefixHex,
  storagePrefix,
  twox64ConcatKey,
  type ChainStorage,
} from "@/lib/substrate-rpc";

/**
 * Staking inputs for the v1 scorer, read from the Portaldot Substrate node.
 *
 * ScoreRegistry's indexed validator is the 32-byte AccountId. Session.Validators
 * stores the same bytes. There is no separate H160 conversion: the live ids
 * are already AccountId32, and toSs58 uses those 32 bytes.
 */

export const CHILL_LIMIT =
  "Chills are not available on this chain. Staking.Chilled is an event with a stash field, and System.Events is not indexed. A 30-era window is about 108,000 blocks, so this reader does not guess a count. The v1 scorer receives 0 and the breakdown labels the raw value not available on this chain.";

export const SLASH_LIMIT =
  "Slash count is ValidatorSlashInEra plus UnappliedSlashes rows for that stash inside the 84-era window. Both maps are read at the chain head. SlashingSpans and Offences.Reports can name a stash without a slash era, and those rows are not counted.";

/** Runtime constant HistoryDepth. Storage for this item is empty; the value lives in metadata. */
export const STAKING_HISTORY_DEPTH = HISTORY_DEPTH_ERAS;

export interface ChainStaking {
  currentEra: number;
  /** Eras that still have an ErasRewardPoints record, ascending. */
  retainedEras: number[];
  /** account (0x…) -> era -> points. Only eras in retainedEras. */
  points: Map<string, Map<number, number>>;
  accounts: Map<string, AccountStake>;
}

export interface AccountStake {
  commissionPercent: number;
  /** Whole tPOT, from Staking.Ledger.active / 10^decimals. */
  selfStakeTokens: number;
  /** Eras in retained storage with a slash row for this stash. */
  slashEras: number[];
}

export interface StakingView {
  input: ScorerInput;
  notes: string[];
  prunedEras: number[];
  /** Eras in the uptime window whose reward-point record is still stored. */
  recordedEras: number[];
}

/**
 * The published ScoreRegistry id is the stash AccountId.
 * 32-byte hex, with or without 0x.
 */
export function scoreIdToAccount(scoreId: string): string {
  const hex = scoreId.toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error("ScoreRegistry id is not a 32-byte account");
  }
  return `0x${hex}`;
}

export function decodeCompact(bytes: Uint8Array, offset: number): { value: bigint; next: number } {
  const first = bytes[offset];
  const mode = first & 3;
  if (mode === 0) return { value: BigInt(first >> 2), next: offset + 1 };
  if (mode === 1) {
    const raw = bytes[offset] | (bytes[offset + 1] << 8);
    return { value: BigInt(raw >> 2), next: offset + 2 };
  }
  if (mode === 2) {
    let raw = 0;
    for (let i = 0; i < 4; i++) raw |= bytes[offset + i] << (8 * i);
    return { value: BigInt(raw >>> 2), next: offset + 4 };
  }
  const length = (first >> 2) + 4;
  let value = BigInt(0);
  for (let i = 0; i < length; i++) {
    value |= BigInt(bytes[offset + 1 + i]) << (BigInt(8) * BigInt(i));
  }
  return { value, next: offset + 1 + length };
}

/** ActiveEraInfo begins with the era index. CurrentEra on this runtime is the same u32. */
export function decodeEraIndex(hex: string): number {
  const bytes = Buffer.from(hex.replace(/^0x/, ""), "hex");
  if (bytes.length < 4) throw new Error("era index is too short");
  return bytes.readUInt32LE(0);
}

/** ValidatorPrefs: compact Perbill commission, then a blocked bool. */
export function decodeCommissionPercent(hex: string): number {
  const bytes = Buffer.from(hex.replace(/^0x/, ""), "hex");
  const commission = decodeCompact(bytes, 0);
  return Number(commission.value) / 10_000_000;
}

/**
 * StakingLedger: stash, compact total, compact active.
 * active is the bonded amount still at stake. Divided by token decimals.
 */
export function decodeSelfStakeTokens(hex: string, decimals = TOKEN_DECIMALS): number {
  const bytes = Buffer.from(hex.replace(/^0x/, ""), "hex");
  if (bytes.length < 34) throw new Error("staking ledger is too short");
  let offset = 32;
  const total = decodeCompact(bytes, offset);
  offset = total.next;
  const active = decodeCompact(bytes, offset);
  const scale = BigInt(10) ** BigInt(decimals);
  const whole = active.value / scale;
  const fraction = active.value % scale;
  return Number(whole) + Number(fraction) / Number(scale);
}

/** EraRewardPoints: total u32, then a compact map of AccountId -> u32. */
export function decodeRewardPoints(hex: string): Map<string, number> {
  const bytes = Buffer.from(hex.replace(/^0x/, ""), "hex");
  const count = decodeCompact(bytes, 4);
  const points = new Map<string, number>();
  let offset = count.next;
  for (let i = 0; i < Number(count.value); i++) {
    const account = `0x${Buffer.from(bytes.subarray(offset, offset + 32)).toString("hex")}`;
    const value = bytes.readUInt32LE(offset + 32);
    points.set(account, value);
    offset += 36;
  }
  return points;
}

function eraFromPrefixedKey(key: string, prefix: string): number | null {
  const body = key.toLowerCase().replace(/^0x/, "");
  const head = prefix.toLowerCase().replace(/^0x/, "");
  if (!body.startsWith(head) || body.length < head.length + 24) return null;
  const eraHex = body.slice(head.length + 16, head.length + 24);
  return Buffer.from(eraHex, "hex").readUInt32LE(0);
}

function hexBytes(hex: string): Buffer {
  return Buffer.from(hex.replace(/^0x/, ""), "hex");
}

export async function loadChainStaking(
  storage: ChainStorage,
  accounts: readonly string[],
): Promise<ChainStaking> {
  const normalized = accounts.map(scoreIdToAccount);
  const activeEraHex = await storage.getStorage(prefixHex("Staking", "ActiveEra"));
  if (!activeEraHex) throw new Error("Staking.ActiveEra is empty");
  const currentEra = decodeEraIndex(activeEraHex);

  const rewardPrefix = prefixHex("Staking", "ErasRewardPoints");
  const rewardKeys = await storage.getKeysPaged(rewardPrefix);
  const rewardKeyByEra = new Map<number, string>();
  for (const key of rewardKeys) {
    const era = eraFromPrefixedKey(key, rewardPrefix);
    if (era != null) rewardKeyByEra.set(era, key);
  }
  const retainedEras = [...rewardKeyByEra.keys()].sort((a, b) => a - b);
  const values = await storage.queryAt([...rewardKeyByEra.values()]);
  const points = new Map<string, Map<number, number>>();
  for (const account of normalized) points.set(account, new Map());
  for (const [era, key] of rewardKeyByEra) {
    const hex = values.get(key.toLowerCase());
    if (!hex) continue;
    const decoded = decodeRewardPoints(hex);
    for (const account of normalized) {
      const value = decoded.get(account);
      if (value != null) points.get(account)?.set(era, value);
    }
  }

  const validatorPrefix = storagePrefix("Staking", "Validators");
  const bondedPrefix = storagePrefix("Staking", "Bonded");
  const ledgerPrefix = storagePrefix("Staking", "Ledger");
  const slashPrefix = prefixHex("Staking", "ValidatorSlashInEra");
  const unappliedPrefix = prefixHex("Staking", "UnappliedSlashes");
  const [slashKeys, unappliedKeys] = await Promise.all([
    storage.getKeysPaged(slashPrefix),
    storage.getKeysPaged(unappliedPrefix),
  ]);
  const unappliedValues =
    unappliedKeys.length === 0
      ? new Map<string, string | null>()
      : await storage.queryAt(unappliedKeys);

  const accountState = new Map<string, AccountStake>();
  for (const account of normalized) {
    const raw = hexBytes(account);
    const prefsHex = await storage.getStorage(twox64ConcatKey(validatorPrefix, raw));
    const bondedHex = await storage.getStorage(twox64ConcatKey(bondedPrefix, raw));
    const controller = bondedHex ? scoreIdToAccount(bondedHex) : account;
    const ledgerHex = await storage.getStorage(
      blake128ConcatKey(ledgerPrefix, hexBytes(controller)),
    );
    if (!prefsHex || !ledgerHex) {
      throw new Error(`Missing prefs or ledger for ${account}`);
    }
    const slashEras = new Set<number>();
    for (const key of slashKeys) {
      if (!key.toLowerCase().includes(account.slice(2))) continue;
      const era = eraFromPrefixedKey(key, slashPrefix);
      if (era != null) slashEras.add(era);
    }
    for (const key of unappliedKeys) {
      const era = eraFromPrefixedKey(key, unappliedPrefix);
      const value = unappliedValues.get(key.toLowerCase());
      if (era == null || !value || !value.toLowerCase().includes(account.slice(2))) continue;
      slashEras.add(era);
    }
    accountState.set(account, {
      commissionPercent: decodeCommissionPercent(prefsHex),
      selfStakeTokens: decodeSelfStakeTokens(ledgerHex),
      slashEras: [...slashEras].sort((a, b) => a - b),
    });
  }

  return { currentEra, retainedEras, points, accounts: accountState };
}

export function buildStakingView(
  chain: ChainStaking,
  accountId: string,
  era: number,
): StakingView {
  const account = scoreIdToAccount(accountId);
  const stake = chain.accounts.get(account);
  if (!stake) throw new Error(`No staking row for ${account}`);
  const series: number[] = [];
  const prunedEras: number[] = [];
  const recordedEras: number[] = [];
  const start = era - ERA_POINTS_WINDOW + 1;
  const byEra = chain.points.get(account) ?? new Map<number, number>();
  for (let cursor = start; cursor <= era; cursor++) {
    if (!chain.retainedEras.includes(cursor)) {
      prunedEras.push(cursor);
      series.push(0);
      continue;
    }
    recordedEras.push(cursor);
    series.push(byEra.get(cursor) ?? 0);
  }
  const slashStart = Math.max(0, era - SLASH_WINDOW_ERAS + 1);
  const slashes = stake.slashEras.filter((slashEra) => slashEra >= slashStart && slashEra <= era)
    .length;
  const activeEras = chain.retainedEras.filter((retained) => (byEra.get(retained) ?? 0) > 0)
    .length;
  const notes = [
    CHILL_LIMIT,
    SLASH_LIMIT,
    "Commission is the current Staking.Validators preference, not the preference stored for the scored era.",
    "Self-stake is Staking.Ledger.active for the bonded controller, in whole tPOT, at the chain head.",
    `Active eras are retained ErasRewardPoints rows with points above 0. History before era ${chain.retainedEras[0] ?? "?"} is gone.`,
  ];
  if (prunedEras.length > 0) {
    notes.push(
      `Eras ${prunedEras[0]}–${prunedEras[prunedEras.length - 1]} are outside retained ErasRewardPoints (${chain.retainedEras[0]}–${chain.retainedEras[chain.retainedEras.length - 1]}). The v1 window has no unknown state, so those slots are 0 and count as down.`,
    );
  }
  return {
    input: {
      activeEras,
      eraPoints: series,
      commissionPercent: stake.commissionPercent,
      chills: 0,
      slashes,
      selfStake: stake.selfStakeTokens,
    },
    notes,
    prunedEras,
    recordedEras,
  };
}

export async function loadLiveStaking(accounts: readonly string[]): Promise<ChainStaking> {
  return loadChainStaking(httpChainStorage(), accounts);
}
