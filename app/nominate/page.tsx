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
  return (
    <Suspense fallback={<NominateSkeleton />}>
      <NominateFromQuery searchParams={searchParams} />
    </Suspense>
  );
}

async function NominateFromQuery({
  searchParams,
}: {
  searchParams: Promise<{ add?: string | string[]; state?: string | string[] }>;
}) {
  const params = await searchParams;
  const data = getDataProvider();
  let validators: Validator[] = [];
  let era = 0;
  let failed = false;
  try {
    [validators, { era }] = await Promise.all([
      data.listValidators(),
      data.getOverview(),
    ]);
  } catch {
    failed = true;
  }
  const state = failed ? "error" : readPreviewState(params.state);
  const add = params.add;
  const requested = typeof add === "string" ? add : null;
  const addId = previewAddId(state, requested);
  const status =
    state !== "error" && validators.length === 0 ? "empty" : nominateStatus(state);
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
