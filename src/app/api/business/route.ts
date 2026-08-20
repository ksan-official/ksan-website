import { NextResponse } from "next/server";
import { businessJobs, type BusinessJob, type JobType } from "@/lib/business";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type BusinessPostRow = {
  accent: BusinessJob["accent"] | null;
  apply_mode: "email" | "external_link" | "internal_form";
  apply_target: string;
  company: string;
  deadline: string | null;
  department: string | null;
  description: string;
  employment_type: string | null;
  featured: boolean | null;
  id: string;
  location: string | null;
  tags: string[] | null;
  title: string;
};

function toJob(row: BusinessPostRow): BusinessJob {
  const applyTarget = row.apply_mode === "email" && !row.apply_target.startsWith("mailto:")
    ? `mailto:${row.apply_target}`
    : row.apply_target;

  return {
    accent: row.accent ?? "orange",
    applyTarget,
    company: row.company,
    deadline: row.deadline,
    department: row.department ?? "General",
    description: row.description,
    featured: Boolean(row.featured),
    id: row.id,
    location: row.location ?? "네덜란드",
    tags: row.tags ?? [],
    title: row.title,
    type: (row.employment_type ?? "풀타임") as JobType
  };
}

function missingAccentColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes("accent"));
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ jobs: businessJobs, source: "fallback" });
  }

  try {
    const supabase = createServerSupabaseClient();
    const baseSelect = "id,title,company,location,employment_type,deadline,apply_mode,apply_target,description,department,tags,featured";
    let { data, error } = await supabase
      .from("business_posts")
      .select(`${baseSelect},accent`)
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("featured_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (missingAccentColumn(error)) {
      const fallback = await supabase
        .from("business_posts")
        .select(baseSelect)
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("featured_order", { ascending: true })
        .order("created_at", { ascending: false });
      data = fallback.data?.map((post) => ({ ...post, accent: "orange" })) ?? null;
      error = fallback.error;
    }

    if (error || !data?.length) {
      return NextResponse.json({ jobs: businessJobs, source: "fallback" });
    }

    return NextResponse.json({ jobs: (data as BusinessPostRow[]).map(toJob), source: "supabase" });
  } catch {
    return NextResponse.json({ jobs: businessJobs, source: "fallback" });
  }
}
