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

/** Alice's account id. Cache Components needs at least one param at build. */
const FALLBACK_PARAM = {
  id: "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",
};

export async function generateStaticParams() {
  try {
    const ids = (await getDataProvider().listValidators()).map((validator) => ({
      id: validator.id,
    }));
    return ids.length > 0 ? ids : [FALLBACK_PARAM];
  } catch {
    return [FALLBACK_PARAM];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const validator = await getDataProvider()
    .getValidator(id)
    .catch(() => undefined);
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
  if (state === "loading") return <ReportSkeleton />;

  const data = getDataProvider();
  let validator;
  let era;
  try {
    [validator, { era }] = await Promise.all([
      data.getValidator(id),
      data.getOverview(),
    ]);
  } catch {
    validator = null;
  }

  if (state === "error" || validator === null) {
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

  return <ValidatorReport validator={validator} era={validator.scoreEra ?? era ?? 0} />;
}
