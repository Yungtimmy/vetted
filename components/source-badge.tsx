import { VALIDATOR_SOURCE_LABEL, type ValidatorSource } from "@/lib/types";

/** Quiet hairline tag. Testnet and mainnet history share one treatment. */
export function SourceBadge({ source }: { source: ValidatorSource }) {
  return <span className="tag font-sans">{VALIDATOR_SOURCE_LABEL[source]}</span>;
}
