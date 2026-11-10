import { keccak_256 } from "@noble/hashes/sha3.js";
import type { Grade } from "@/lib/types";

const PUBLISH_SELECTOR = keccak_256(
  new TextEncoder().encode("publish(bytes32,uint256,uint256,uint256)"),
).subarray(0, 4);

const GRADE_CODE: Record<Exclude<Grade, "NEW">, number> = {
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  F: 70,
};

function word(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}

/**
 * ABI calldata for ScoreRegistry.publish. This does not send a transaction.
 * Grade is the ASCII code the contract requires.
 */
export function publishCalldata(
  accountId: string,
  era: number,
  score: number,
  grade: Exclude<Grade, "NEW">,
): string {
  const account = accountId.toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(account)) {
    throw new Error("publish account id must be 32 bytes");
  }
  const selector = Buffer.from(PUBLISH_SELECTOR).toString("hex");
  const gradeCode = GRADE_CODE[grade];
  return `0x${selector}${word(BigInt(`0x${account}`))}${word(BigInt(era))}${word(BigInt(score))}${word(BigInt(gradeCode))}`;
}

export function publishSelectorHex(): string {
  return `0x${Buffer.from(PUBLISH_SELECTOR).toString("hex")}`;
}
