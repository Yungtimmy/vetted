import {
  VALIDATOR_SOURCE_LABEL,
  type ValidatorSource,
} from "@/lib/types";

const STYLE: Record<ValidatorSource, { background: string; color: string; border?: string }> = {
  "mainnet-history": { background: "var(--panel-2)", color: "var(--muted)" },
  "testnet-live": {
    background: "#3ddba81a",
    color: "var(--grade-a)",
    border: "1px solid #3ddba840",
  },
};

export function SourceBadge({ source }: { source: ValidatorSource }) {
  return (
    <span
      className="tag"
      style={{
        background: STYLE[source].background,
        color: STYLE[source].color,
        border: STYLE[source].border,
      }}
    >
      {VALIDATOR_SOURCE_LABEL[source]}
    </span>
  );
}
