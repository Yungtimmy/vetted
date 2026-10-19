import type { Metadata } from "next";
import { Suspense } from "react";
import { Leaderboard } from "@/components/leaderboard";
import { LeaderboardSkeleton } from "@/components/skeletons";
import { getDataProvider } from "@/lib/data";
import { readPreviewState } from "@/lib/preview";

export const metadata: Metadata = {
  title: "Validator report cards",
  description:
    "Know who you're staking with. Scores published on-chain every era.",
};

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ state?: string | string[] }>;
}) {
  const state = readPreviewState((await searchParams).state);
  const data = getDataProvider();
  const overview = data.getOverview();

  if (state === "loading") {
    return <Leaderboard status="loading" overview={null} validators={[]} />;
  }
  if (state === "error") {
    return <Leaderboard status="error" overview={null} validators={[]} />;
  }
  if (state === "empty") {
    return <Leaderboard status="empty" overview={overview} validators={[]} />;
  }
  return (
    <Leaderboard
      status="ready"
      overview={overview}
      validators={data.listValidators()}
    />
  );
}
