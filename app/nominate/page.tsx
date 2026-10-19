import type { Metadata } from "next";
import { Suspense } from "react";
import { NominateFlow } from "@/components/nominate-flow";
import { NominateSkeleton } from "@/components/skeletons";
import { getDataProvider } from "@/lib/data";
import { readPreviewState, type PreviewState } from "@/lib/preview";
import type { Validator } from "@/lib/types";

export const metadata: Metadata = {
  title: "Nominate safely",
  description: "Build a nomination set from scored Portaldot validators.",
};

export default function NominatePage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string | string[]; state?: string | string[] }>;
}) {
  const data = getDataProvider();
  return (
    <Suspense fallback={<NominateSkeleton />}>
      <NominateFromQuery
        searchParams={searchParams}
        validators={data.listValidators()}
        era={data.getOverview().era}
      />
    </Suspense>
  );
}

async function NominateFromQuery({
  searchParams,
  validators,
  era,
}: {
  searchParams: Promise<{ add?: string | string[]; state?: string | string[] }>;
  validators: Validator[];
  era: number;
}) {
  const params = await searchParams;
  const state = readPreviewState(params.state);
  const add = params.add;
  const requested = typeof add === "string" ? add : null;
  const addId = previewAddId(state, requested);
  const status = nominateStatus(state);
  return (
    <NominateFlow
      key={`${addId ?? "default"}-${status}`}
      validators={status === "empty" ? [] : validators}
      era={era}
      addId={addId}
      status={status}
    />
  );
}

function nominateStatus(
  state: PreviewState | null,
): "ready" | "loading" | "empty" | "error" {
  if (state === "loading" || state === "empty" || state === "error") return state;
  return "ready";
}

function previewAddId(state: PreviewState | null, addId: string | null): string | null {
  if (state === "history") return addId ?? "harmattan-node";
  return addId;
}
