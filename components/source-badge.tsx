import {
  VALIDATOR_SOURCE_LABEL,
  type ValidatorSource,
} from "@/lib/types";

const STYLE: Record<ValidatorSource, { background: string; color: string }> = {
  "mainnet-history": { background: "var(--panel-2)", color: "var(--muted)" },
  "testnet-live": { background: "#12352f", color: "var(--teal)" },
};

export function SourceBadge({ source }: { source: ValidatorSource }) {
  return (
    <span
      className="tag"
      style={{
        background: STYLE[source].background,
        color: STYLE[source].color,
      }}
    >
      {VALIDATOR_SOURCE_LABEL[source]}
    </span>
  );
}
