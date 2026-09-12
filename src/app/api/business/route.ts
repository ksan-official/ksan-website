import { NextResponse } from "next/server";
import { businessJobs, businessPreviewJobs, resolveBusinessDetails, type BusinessJob, type JobType } from "@/lib/business";
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
  image_url: string | null;
  image_urls: string[] | null;
  location: string | null;
  logo_url: string | null;
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
    body: row.description,
    company: row.company,
    companyIntro: details.companyIntro,
    deadline: row.deadline,
    department: row.department ?? "공고 확인",
    description: details.summary,
    featured: Boolean(row.featured),
    id: row.id,
    imageUrl: row.image_url,
    imageUrls: row.image_urls?.length ? row.image_urls : row.image_url ? [row.image_url] : [],
    language: details.language,
    location: row.location ?? "공고 확인",
    logoUrl: row.logo_url,
    requirements: details.requirements,
    responsibilities: details.responsibilities,
    tags: row.tags ?? [],
    title: row.title,
    type: (row.employment_type ?? "공고 확인") as JobType
  };
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ jobs: [...businessJobs, ...businessPreviewJobs], source: "fallback" });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("business_posts")
      .select("id,title,company,location,employment_type,deadline,apply_mode,apply_target,description,department,tags,featured,company_intro,responsibilities,requirements,accent,image_url,image_urls,logo_url")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to query business posts from Supabase", error);
      return NextResponse.json({ jobs: [], source: "supabase", error: "채용 공고를 불러오지 못했습니다." }, { status: 500 });
    }

    const databaseJobs = ((data ?? []) as BusinessPostRow[]).map(toJob);
    return NextResponse.json({
      jobs: [...databaseJobs, ...businessPreviewJobs],
      source: "supabase"
    });
  } catch (error) {
    console.error("Failed to load business posts from Supabase", error);
    return NextResponse.json({ jobs: [], source: "supabase", error: "채용 공고를 불러오지 못했습니다." }, { status: 500 });
  }
}
