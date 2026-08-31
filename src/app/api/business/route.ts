import { NextResponse } from "next/server";
import { businessJobs, resolveBusinessDetails, type BusinessJob, type JobType } from "@/lib/business";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type BusinessPostRow = {
  accent: BusinessJob["accent"] | null;
  apply_mode: "email" | "external_link" | "internal_form";
  apply_target: string;
  company: string;
  company_intro: string | null;
  deadline: string | null;
  department: string | null;
  description: string;
  employment_type: string | null;
  featured: boolean | null;
  id: string;
  location: string | null;
  requirements: string | null;
  responsibilities: string | null;
  tags: string[] | null;
  title: string;
};

function toJob(row: BusinessPostRow): BusinessJob {
  const applyTarget = row.apply_mode === "email" && !row.apply_target.startsWith("mailto:")
    ? `mailto:${row.apply_target}`
    : row.apply_target;
  const details = resolveBusinessDetails({
    companyIntro: row.company_intro,
    description: row.description,
    requirements: row.requirements,
    responsibilities: row.responsibilities
  });

  return {
    accent: row.accent ?? "orange",
    applyTarget,
    company: row.company,
    companyIntro: details.companyIntro,
    deadline: row.deadline,
    department: row.department ?? "General",
    description: details.summary,
    featured: Boolean(row.featured),
    id: row.id,
    location: row.location ?? "네덜란드",
    requirements: details.requirements,
    responsibilities: details.responsibilities,
    tags: row.tags ?? [],
    title: row.title,
    type: (row.employment_type ?? "풀타임") as JobType
  };
}

function missingAccentColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes("accent"));
}

function missingDetailColumns(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return ["company_intro", "responsibilities", "requirements"].some((column) => message.includes(column));
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ jobs: businessJobs, source: "fallback" });
  }

  try {
    const supabase = createServerSupabaseClient();
    const baseSelect = "id,title,company,location,employment_type,deadline,apply_mode,apply_target,description,department,tags,featured";
    const detailSelect = `${baseSelect},company_intro,responsibilities,requirements`;
    let { data, error } = await supabase
      .from("business_posts")
      .select(`${detailSelect},accent`)
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("featured_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (missingAccentColumn(error) || missingDetailColumns(error)) {
      const fallback = await supabase
        .from("business_posts")
        .select(baseSelect)
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("featured_order", { ascending: true })
        .order("created_at", { ascending: false });
      data = fallback.data?.map((post) => ({
        ...post,
        accent: "orange",
        company_intro: null,
        requirements: null,
        responsibilities: null
      })) ?? null;
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
