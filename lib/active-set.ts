import { cacheLife } from "next/cache";
import { readActiveValidators } from "@/lib/session-validators";

/**
 * Score keys that are known not to be validators on this chain.
 * Used only when the active set cannot be read.
 * Alice: left over from a test publish for era 1285.
 */
export const HIDDEN_VALIDATORS = new Set([
  "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",
]);

export { readActiveValidators } from "@/lib/session-validators";

/** Cached for a minute. Pages use this. The score CLI calls readActiveValidators. */
export async function fetchActiveValidators(): Promise<string[] | null> {
  "use cache";
  cacheLife("minutes");
  return readActiveValidators();
}
