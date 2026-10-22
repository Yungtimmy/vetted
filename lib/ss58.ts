import { createHash } from "node:crypto";
import { SS58_PREFIX } from "@/lib/config";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58(bytes: Uint8Array): string {
  let n = BigInt(`0x${Buffer.from(bytes).toString("hex") || "0"}`);
  let out = "";
  while (n > BigInt(0)) {
    out = ALPHABET[Number(n % BigInt(58))] + out;
    n /= BigInt(58);
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = `1${out}`;
  }
  return out;
}

/** SS58-encode a 32-byte account id (0x hex) with the chain prefix. */
export function toSs58(accountHex: string, prefix = SS58_PREFIX): string {
  const account = Buffer.from(accountHex.replace(/^0x/, ""), "hex");
  if (account.length !== 32 || prefix > 63) return accountHex;
  const payload = Buffer.concat([Buffer.from([prefix]), account]);
  const checksum = createHash("blake2b512")
    .update(Buffer.concat([Buffer.from("SS58PRE"), payload]))
    .digest()
    .subarray(0, 2);
  return base58(Buffer.concat([payload, checksum]));
}
