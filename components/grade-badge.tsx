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
        className="grade-letter grid h-6 min-w-7 place-items-center rounded-[5px] border px-1 text-[13px] leading-none"
        style={{
          color: COLOR[grade],
          borderColor: `color-mix(in srgb, ${COLOR[grade]} 33%, transparent)`,
          background: `color-mix(in srgb, ${COLOR[grade]} 8%, transparent)`,
          fontSize: isNew ? 10 : undefined,
        }}
      >
        {grade}
      </span>
      {showScore ? (
        <span className="font-mono text-xs text-muted">
          {score == null ? "n/a" : `${score}/100`}
        </span>
      ) : null}
    </span>
  );
}

export function GradeSeal({
  grade,
  size = "lg",
}: {
  grade: Grade;
  size?: "lg" | "md";
}) {
  const isNew = grade === "NEW";
  const dimensions = size === "lg" ? "h-[120px] w-[120px]" : "h-16 w-16";
  const typeSize =
    size === "lg" ? (isNew ? "text-[30px]" : "text-[56px]") : "text-[28px]";
  return (
    <div
      className={`grade-letter grid place-items-center rounded-full leading-none ${dimensions} ${typeSize}`}
      style={{
        background: COLOR[grade],
        color: isNew ? "var(--fg)" : "var(--bg)",
      }}
      aria-hidden
    >
      {grade}
    </div>
  );
}
