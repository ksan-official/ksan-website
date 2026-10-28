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
  return <main id="main" style={{ maxWidth: 728, margin: "0 auto", padding: "32px 20px 110px" }}><LocalActivityBoard key={id} kind="market" recordId={id} viewMessages={view === "messages"} /></main>;
}
