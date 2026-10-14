import type { Metadata } from "next";
import { Suspense } from "react";
import { NominateFlow } from "@/components/nominate-flow";
import { getDataProvider } from "@/lib/data";
import type { Validator } from "@/lib/types";

export const metadata: Metadata = {
  title: "Nominate safely",
  description: "Build a nomination set from scored Portaldot validators.",
};

export default function NominatePage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string | string[] }>;
}) {
  const data = getDataProvider();
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading the nomination set…</p>}>
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
  searchParams: Promise<{ add?: string | string[] }>;
  validators: Validator[];
  era: number;
}) {
  const params = await searchParams;
  const add = params.add;
  const addId = typeof add === "string" ? add : null;
  return (
    <NominateFlow
      key={addId ?? "default"}
      validators={validators}
      era={era}
      addId={addId}
    />
  );
}
