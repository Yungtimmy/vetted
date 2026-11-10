import { createHash } from "node:crypto";
import { SCORING_CONFIG_JSON } from "@/lib/scoring-config";

/** SHA-256 hex of the canonical scoring config. v1 proposed, pending founder approval. */
export const SCORING_CONFIG_SHA256 = createHash("sha256")
  .update(SCORING_CONFIG_JSON, "utf8")
  .digest("hex");
