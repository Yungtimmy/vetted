import { substrateRpc } from "@/lib/substrate-rpc";

/** twox128("Session") ++ twox128("Validators") */
const SESSION_VALIDATORS_KEY =
  "0xcec5070d609dd3497f72bde07fc96ba088dcde934c658227ee1dfafcd6e16903";

/** Decode SCALE Vec<AccountId32>. */
export function decodeAccountList(hex: string): string[] {
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

/** session.validators as 0x account ids, or null if the node can't be read. */
export async function readActiveValidators(): Promise<string[] | null> {
  try {
    const value = await substrateRpc<string | null>("state_getStorage", [
      SESSION_VALIDATORS_KEY,
    ]);
    if (!value) return null;
    return decodeAccountList(value);
  } catch {
    return null;
  }
}
