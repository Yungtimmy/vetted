import type { RewardBar } from "@/lib/types";

export function RewardsChart({ rewards }: { rewards: RewardBar[] }) {
  const width = rewards.length * 11.5;
  const height = 150;
  const max = Math.max(...rewards.map((bar) => bar.value), 1);

  return (
    <svg
      role="img"
      aria-label="Rewards per era. Red bars mark a slash."
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {rewards.map((bar, index) => {
        const barHeight = Math.max(8, (bar.value / max) * 118);
        return (
          <rect
            key={`${index}-${bar.slashed ? "slash" : "era"}`}
            x={index * 11.5}
            y={height - barHeight}
            width="8"
            height={barHeight}
            fill={bar.slashed ? "var(--grade-f)" : "var(--teal)"}
            opacity="0.85"
            rx="1"
          />
        );
      })}
    </svg>
  );
}
