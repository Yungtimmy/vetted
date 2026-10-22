import { cacheLife } from "next/cache";
import { SUBSTRATE_RPC_URL } from "@/lib/config";

/** twox128("Session") ++ twox128("Validators") */
const SESSION_VALIDATORS_KEY =
  "0xcec5070d609dd3497f72bde07fc96ba088dcde934c658227ee1dfafcd6e16903";

const FALLBACK_SUBSTRATE_HTTP = "https://test-node-v3.portaldot.dev";

/**
 * Score keys that are known not to be validators on this chain.
 * Used only when the active set cannot be read.
 * Alice: left over from a test publish for era 1285.
 */
export const HIDDEN_VALIDATORS = new Set([
  "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",
]);

function httpUrl(): string {
  const url = SUBSTRATE_RPC_URL || FALLBACK_SUBSTRATE_HTTP;
  return url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}

/** Decode SCALE Vec<AccountId32>. */
function decodeAccounts(hex: string): string[] {
  const body = hex.replace(/^0x/, "");
  const first = parseInt(body.slice(0, 2), 16);
  const mode = first & 3;
  let count: number;
  let offset: number;
  if (mode === 0) {
    count = first >> 2;
    offset = 2;
  } else if (mode === 1) {
    count = parseInt(body.slice(2, 4) + body.slice(0, 2), 16) >> 2;
    offset = 4;
  } else if (mode === 2) {
    const le = body.slice(0, 8).match(/../g)!.reverse().join("");
    count = parseInt(le, 16) >>> 2;
    offset = 8;
  } else {
    throw new Error("Unsupported compact length");
  }
  const accounts: string[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = body.slice(offset + i * 64, offset + i * 64 + 64);
    if (chunk.length !== 64) throw new Error("Validator list is too short");
    accounts.push(`0x${chunk.toLowerCase()}`);
  }
  return accounts;
}

/** session.validators as 0x account ids, or null if the node can't be read. Cached for a minute. */
export async function fetchActiveValidators(): Promise<string[] | null> {
  "use cache";
  cacheLife("minutes");
  try {
    const response = await fetch(httpUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "state_getStorage",
        params: [SESSION_VALIDATORS_KEY],
      }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { result?: string | null };
    if (!body.result) return null;
    return decodeAccounts(body.result);
  } catch {
    return null;
  }
}
