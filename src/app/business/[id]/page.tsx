import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Building2, CalendarClock, MapPin } from "lucide-react";
import { BusinessDetailActions } from "@/components/BusinessDetailActions";
import { BusinessFormattedBody } from "@/components/BusinessFormattedBody";
import { businessJobs, composeBusinessDetailText, resolveBusinessDetails, type BusinessJob, type JobType } from "@/lib/business";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

function applyTarget(row: Pick<BusinessPostRow, "apply_mode" | "apply_target">) {
  return row.apply_mode === "email" && !row.apply_target.startsWith("mailto:")
    ? `mailto:${row.apply_target}`
    : row.apply_target;
}

function toJob(row: BusinessPostRow): BusinessJob {
  const details = resolveBusinessDetails({
    companyIntro: row.company_intro,
    description: row.description,
    requirements: row.requirements,
    responsibilities: row.responsibilities
  });

  return {
    accent: row.accent ?? "orange",
    applyTarget: applyTarget(row),
    body: row.description,
    company: row.company,
    companyIntro: details.companyIntro,
    deadline: row.deadline,
    department: row.department ?? "General",
    description: details.summary,
    featured: Boolean(row.featured),
    id: row.id,
    imageUrl: row.image_url,
    imageUrls: row.image_urls?.length ? row.image_urls : row.image_url ? [row.image_url] : [],
    language: details.language,
    location: row.location ?? "네덜란드",
    logoUrl: row.logo_url,
    requirements: details.requirements,
    responsibilities: details.responsibilities,
    tags: row.tags ?? [],
    title: row.title,
    type: (row.employment_type ?? "풀타임") as JobType
  };
}

function deadlineLabel(deadline: string | null) {
  if (!deadline) return "상시 채용";
  const today = new Date();
  const end = new Date(`${deadline}T23:59:59`);
  const days = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
  if (days === 0) return "오늘 마감";
  return `마감 D-${days}`;
}

async function getBusinessJob(id: string) {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("business_posts")
        .select("id,title,company,location,employment_type,deadline,apply_mode,apply_target,description,department,tags,featured,company_intro,responsibilities,requirements,accent,image_url,image_urls,logo_url")
        .eq("id", id)
        .eq("published", true)
        .maybeSingle();

      if (!error && data) return toJob(data as BusinessPostRow);
    } catch (error) {
      console.error("Failed to load business post from Supabase", error);
    }
  }

  return businessJobs.find((job) => job.id === id) ?? null;
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getBusinessJob(id);

  if (!job) {
    notFound();
  }

  const language = job.language ?? "ko";
  const body = job.body ?? composeBusinessDetailText({
    companyIntro: job.companyIntro,
    description: job.description,
    language: job.language,
    requirements: job.requirements,
    responsibilities: job.responsibilities
  });
  return (
    <main className={`business-detail-page business-detail-page--${job.accent}`} id="main" lang="ko">
      <Link className="business-detail-back" href="/business">
        <ArrowLeft aria-hidden size={18} />
        채용 공고 목록
      </Link>

      <section className="business-detail-hero">
        <div>
          <p className="business-hub-kicker">{job.company}</p>
          <h1 lang={language}>{job.title}</h1>
          <p lang={language}>{job.description}</p>
          {job.tags.length ? (
            <div className="business-detail-tags">
              {job.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="business-detail-content">
        <div className="business-detail-sections">
          <article className="business-detail-section business-detail-section--body">
            <BusinessFormattedBody body={body} language={language} />
          </article>
        </div>
        <div className="business-detail-side-rail">
          <aside className="business-detail-facts">
            <div><Building2 aria-hidden size={21} /><span>회사</span><strong lang={language}>{job.company}</strong></div>
            <div><MapPin aria-hidden size={21} /><span>지역</span><strong>{job.location}</strong></div>
            <div><BriefcaseBusiness aria-hidden size={21} /><span>고용 형태</span><strong>{job.type}</strong></div>
            <div><CalendarClock aria-hidden size={21} /><span>마감</span><strong>{deadlineLabel(job.deadline)}</strong></div>
          </aside>
          <BusinessDetailActions applyTarget={job.applyTarget} jobId={job.id} />
        </div>
      </section>
    </main>
  );
}
