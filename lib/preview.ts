/** Dev-only screen states. Production ignores the query. */
export const PREVIEW_STATES = [
  "loading",
  "empty",
  "error",
  "missing",
  "history",
] as const;

export type PreviewState = (typeof PREVIEW_STATES)[number];

export function readPreviewState(
  value: string | string[] | undefined,
): PreviewState | null {
  if (process.env.NODE_ENV === "production") return null;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  return (PREVIEW_STATES as readonly string[]).includes(raw)
    ? (raw as PreviewState)
    : null;
}
