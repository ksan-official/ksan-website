import { GuidesExperience } from "@/components/GuidesExperience";
import { listGuides } from "@/lib/guides";

export default async function GuidesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const guides = await listGuides();

  return <GuidesExperience guides={guides} initialQuery={query} />;
}
