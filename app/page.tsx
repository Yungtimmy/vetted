import type { Metadata } from "next";
import { Leaderboard } from "@/components/leaderboard";
import { getDataProvider } from "@/lib/data";

export const metadata: Metadata = {
  title: "Validator report cards",
  description:
    "Know who you're staking with. Scores published on-chain every era.",
};

export default function HomePage() {
  const data = getDataProvider();
  return (
    <Leaderboard
      overview={data.getOverview()}
      validators={data.listValidators()}
    />
  );
}
