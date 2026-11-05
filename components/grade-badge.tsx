import type { Grade } from "@/lib/types";

const COLOR: Record<Grade, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
  D: "var(--grade-d)",
  F: "var(--grade-f)",
  NEW: "var(--grade-new)",
};

export function gradeColor(grade: Grade): string {
  return COLOR[grade];
}

function markStyle(grade: Grade, borderMix: string) {
  return {
    color: COLOR[grade],
    borderColor: `color-mix(in srgb, ${COLOR[grade]} ${borderMix}, transparent)`,
    background: `color-mix(in srgb, ${COLOR[grade]} 12%, transparent)`,
  };
}

/** 28px letter mark used on the leaderboard and compact set score. */
export function GradeBadge({
  grade,
  score,
  showScore = true,
}: {
  grade: Grade;
  score: number | null;
  showScore?: boolean;
}) {
  const isNew = grade === "NEW";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="grade-letter grid h-7 min-w-7 place-items-center rounded-[6px] border px-1 text-[13px] leading-none"
        style={{
          ...markStyle(grade, "32%"),
          fontSize: isNew ? 10 : undefined,
        }}
      >
        {grade}
      </span>
      {showScore ? (
        <span className="font-mono text-xs text-dim tabular-nums">
          {score == null ? "n/a" : `${score}/100`}
        </span>
      ) : null}
    </span>
  );
}

/** 56px letter mark on a report. The md size matches the leaderboard mark. */
export function GradeSeal({
  grade,
  size = "lg",
}: {
  grade: Grade;
  size?: "lg" | "md";
}) {
  const isNew = grade === "NEW";
  const dimensions =
    size === "lg"
      ? "h-14 w-14 rounded-[10px] text-[28px]"
      : "h-7 w-7 rounded-[6px] text-[13px]";
  const typeSize = isNew ? (size === "lg" ? "text-sm" : "text-[9px]") : "";
  return (
    <div
      className={`grade-letter grid place-items-center border leading-none ${dimensions} ${typeSize}`}
      style={markStyle(grade, size === "lg" ? "36%" : "32%")}
    >
      {grade}
    </div>
  );
}
