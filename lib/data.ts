import { mockProvider } from "@/lib/mock-provider";
import type { ValidatorDataProvider } from "@/lib/types";

/**
 * The only import pages should use to read validator data.
 *
 * Swap `mockProvider` for a live implementation of `ValidatorDataProvider`
 * when the chain is ready. Planned reads:
 *
 * - Substrate RPC (`NEXT_PUBLIC_SUBSTRATE_RPC_URL`): session and staking
 *   state, era points, chill and slash events, self-stake, commission.
 * - EVM RPC (`NEXT_PUBLIC_EVM_RPC_URL`) plus the score contract: the grade,
 *   the 0–100 score, the era it was published in, and the publishing tx.
 *
 * H160 account ids returned by the EVM side are Portaldot account ids,
 * not Ethereum addresses. Token symbol and decimals come from
 * NEXT_PUBLIC_TOKEN_SYMBOL and NEXT_PUBLIC_TOKEN_DECIMALS
 * (confirmed defaults tPOT and 14 when unset). Chain id and both RPC
 * URLs are env-driven the same way. Official endpoints are in
 * `.env.example`. Scores will be mainnet history published on the
 * testnet contract, with the testnet's live validators alongside.
 */
export function getDataProvider(): ValidatorDataProvider {
  return mockProvider;
}

export type {
  Grade,
  HistoryEvent,
  HistoryKind,
  NetworkOverview,
  RewardBar,
  ScoreFactor,
  Validator,
  ValidatorDataProvider,
  ValidatorSource,
} from "@/lib/types";
