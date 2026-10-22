import { DATA_SOURCE } from "@/lib/config";
import { liveProvider } from "@/lib/live-provider";
import { mockProvider } from "@/lib/mock-provider";
import type { ValidatorDataProvider } from "@/lib/types";

/**
 * The only import pages should use to read validator data.
 *
 * Live (default): latest ScorePublished log per validator from the
 * ScoreRegistry contract over the EVM RPC (`NEXT_PUBLIC_EVM_RPC_URL`,
 * `NEXT_PUBLIC_SCORE_REGISTRY_ADDRESS`). Staking fields from the
 * Substrate RPC are not read yet.
 *
 * Set `NEXT_PUBLIC_DATA_SOURCE=mock` to use the sample validators.
 */
export function getDataProvider(): ValidatorDataProvider {
  return DATA_SOURCE === "mock" ? mockProvider : liveProvider;
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
