import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ValidatorReport } from "@/components/validator-report";
import { getDataProvider } from "@/lib/data";

interface Params {
  params: Promise<{ id: string }>;
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

export default async function ValidatorPage({ params }: Params) {
  const { id } = await params;
  const data = getDataProvider();
  const validator = data.getValidator(id);
  if (!validator) notFound();
  return <ValidatorReport validator={validator} era={data.getOverview().era} />;
}
