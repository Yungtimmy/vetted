import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadNote } from "@/components/data-states";
import { ReportSkeleton } from "@/components/skeletons";
import { ValidatorReport } from "@/components/validator-report";
import { getDataProvider } from "@/lib/data";
import { readPreviewState } from "@/lib/preview";

interface Params {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string | string[] }>;
}

export function generateStaticParams() {
  return getDataProvider()
    .listValidators()
    .map((validator) => ({ id: validator.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const validator = getDataProvider().getValidator(id);
  if (!validator) return { title: "Validator" };
  return {
    title: validator.name,
    description: `Report card for ${validator.name} on Portaldot.`,
  };
}

export default function ValidatorPage({ params, searchParams }: Params) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ValidatorContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ValidatorContent({ params, searchParams }: Params) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const state = readPreviewState(query.state);
  const data = getDataProvider();
  const validator = data.getValidator(id);

  if (state === "loading") return <ReportSkeleton />;

  if (state === "error") {
    return (
      <LoadNote
        message="This report could not be loaded."
        action="Retry"
        actionHref={`/validator/${id}`}
      />
    );
  }

  if (state === "missing" || !validator) {
    return (
      <LoadNote
        message="No validator with that id."
        action="Back to the leaderboard"
        actionHref="/"
      />
    );
  }

  return <ValidatorReport validator={validator} era={data.getOverview().era} />;
}
