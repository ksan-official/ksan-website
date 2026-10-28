import { notFound } from "next/navigation";
import { LocalActivityBoard } from "@/components/LocalActivityBoard";
import { isLocalDesignMode } from "@/lib/design-preview";

export default async function ActivityDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  if (!isLocalDesignMode) notFound();
  const { id } = await params;
  const { view } = await searchParams;
  return <main id="main" style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 100px" }}><LocalActivityBoard key={id} kind="community" recordId={id} viewMessages={view === "messages"} /></main>;
}
