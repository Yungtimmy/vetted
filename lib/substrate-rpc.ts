import xxhashjs from "xxhashjs";
import { blake2b } from "blakejs";
import { RPC_USER_AGENT, SUBSTRATE_RPC_URL } from "@/lib/config";

const FALLBACK_SUBSTRATE_HTTP = "https://test-node-v3.portaldot.dev";

/** HTTP endpoint for the Substrate JSON-RPC. `wss://` in env becomes `https://`. */
export function substrateHttpUrl(): string {
  const url = SUBSTRATE_RPC_URL || FALLBACK_SUBSTRATE_HTTP;
  return url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}

export async function substrateRpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(substrateHttpUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": RPC_USER_AGENT,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`${method} failed with HTTP ${response.status}`);
  const body = (await response.json()) as { result?: T; error?: { message: string } };
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result as T;
}

function le64(hex: string): Buffer {
  return Buffer.from(hex.padStart(16, "0").match(/../g)!.reverse().join(""), "hex");
}

/** twox_64, little-endian, matching Substrate's xxhash. */
export function twox64(data: Uint8Array): Buffer {
  return le64(xxhashjs.h64(Buffer.from(data), 0).toString(16));
}

/** twox_128 of a pallet or storage name. */
export function twox128(text: string): Buffer {
  const bytes = Buffer.from(text);
  return Buffer.concat([
    le64(xxhashjs.h64(bytes, 0).toString(16)),
    le64(xxhashjs.h64(bytes, 1).toString(16)),
  ]);
}

export function storagePrefix(pallet: string, item: string): Buffer {
  return Buffer.concat([twox128(pallet), twox128(item)]);
}

export function prefixHex(pallet: string, item: string): string {
  return `0x${storagePrefix(pallet, item).toString("hex")}`;
}

/** Twox64Concat key. Staking.Validators, Bonded, and era maps use this. */
export function twox64ConcatKey(prefix: Buffer, key: Buffer): string {
  return `0x${Buffer.concat([prefix, twox64(key), key]).toString("hex")}`;
}

/** Blake2_128Concat key. Staking.Ledger uses this on the controller. */
export function blake128ConcatKey(prefix: Buffer, key: Buffer): string {
  const hash = Buffer.from(blake2b(key, null, 16));
  return `0x${Buffer.concat([prefix, hash, key]).toString("hex")}`;
}

export function u32le(value: number): Buffer {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value);
  return bytes;
}

/** Twox64Concat(EraIndex). */
export function eraStorageKey(prefix: Buffer, era: number): string {
  return twox64ConcatKey(prefix, u32le(era));
}

export interface ChainStorage {
  getStorage(key: string): Promise<string | null>;
  getKeysPaged(prefix: string): Promise<string[]>;
  queryAt(keys: string[]): Promise<Map<string, string | null>>;
}

export function httpChainStorage(): ChainStorage {
  return {
    async getStorage(key) {
      const value = await substrateRpc<string | null>("state_getStorage", [key]);
      return value ?? null;
    },
    async getKeysPaged(prefix) {
      const keys: string[] = [];
      let start: string | undefined;
      for (;;) {
        const params = start ? [prefix, 200, start] : [prefix, 200];
        const page = await substrateRpc<string[]>("state_getKeysPaged", params);
        keys.push(...page);
        if (page.length < 200) break;
        start = page[page.length - 1];
      }
      return keys;
    },
    async queryAt(keys) {
      const found = new Map<string, string | null>();
      if (keys.length === 0) return found;
      const chunkSize = 40;
      for (let i = 0; i < keys.length; i += chunkSize) {
        const chunk = keys.slice(i, i + chunkSize);
        const sets = await substrateRpc<
          Array<{ changes: Array<[string, string | null]> }>
        >("state_queryStorageAt", [chunk]);
        for (const change of sets[0]?.changes ?? []) {
          found.set(change[0].toLowerCase(), change[1]);
        }
      }
      return found;
    },
  };
}
