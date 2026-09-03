import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, Building2, CalendarClock, MapPin } from "lucide-react";
import { businessJobs, resolveBusinessDetails, type BusinessJob, type JobType } from "@/lib/business";
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
  location: string | null;
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

function sectionLines(value: string) {
  return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function deadlineLabel(deadline: string | null) {
  if (!deadline) return "상시 채용";
  const today = new Date();
  const end = new Date(`${deadline}T23:59:59`);
  const days = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
  if (days === 0) return "오늘 마감";
  return `마감 D-${days}`;
}

function applyLabel(target: string) {
  return target.startsWith("mailto:") ? "이메일로 지원하기" : "지원 페이지 열기";
}

async function getBusinessJob(id: string) {
  if (hasSupabaseConfig()) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("business_posts")
      .select("id,title,company,location,employment_type,deadline,apply_mode,apply_target,description,department,tags,featured,company_intro,responsibilities,requirements,accent")
      .eq("id", id)
      .eq("published", true)
      .single();

    if (error) throw new Error(error.message);
    if (data) return toJob(data as BusinessPostRow);
    return null;
  }

  return businessJobs.find((job) => job.id === id) ?? null;
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getBusinessJob(id);

  if (!job) {
    notFound();
  }

  const externalApply = !job.applyTarget.startsWith("mailto:");

  return (
    <main className={`business-detail-page business-detail-page--${job.accent}`} id="main">
      <Link className="business-detail-back" href="/business">
        <ArrowLeft aria-hidden size={18} />
        채용 공고 목록
      </Link>

      <section className="business-detail-hero">
        <div>
          <p className="business-hub-kicker">{job.company}</p>
          <h1>{job.title}</h1>
          <p>{job.description}</p>
          <div className="business-detail-tags">
            {job.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      </section>

      <section className="business-detail-content">
        <div className="business-detail-sections">
          <article className="business-detail-section">
            <p className="eyebrow">01</p>
            <h2>회사 소개</h2>
            <p>{job.companyIntro}</p>
          </article>
          <article className="business-detail-section">
            <p className="eyebrow">02</p>
            <h2>주요 업무</h2>
            <ul>
              {sectionLines(job.responsibilities).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </article>
          <article className="business-detail-section">
            <p className="eyebrow">03</p>
            <h2>자격 요건</h2>
            <ul>
              {sectionLines(job.requirements).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </article>
          <article className="business-detail-section business-detail-section--apply">
            <p className="eyebrow">04</p>
            <h2>지원하기</h2>
            <p>관심 있는 공고라면 회사명, 포지션, 근무 지역, 마감일을 한 번 더 확인한 뒤 지원해주세요.</p>
            <a href={job.applyTarget} rel={externalApply ? "noreferrer" : undefined} target={externalApply ? "_blank" : undefined}>
              {applyLabel(job.applyTarget)} <ArrowUpRight aria-hidden size={18} />
            </a>
          </article>
        </div>
        <aside className="business-detail-facts">
          <div><Building2 aria-hidden size={21} /><span>회사</span><strong>{job.company}</strong></div>
          <div><MapPin aria-hidden size={21} /><span>지역</span><strong>{job.location}</strong></div>
          <div><BriefcaseBusiness aria-hidden size={21} /><span>고용 형태</span><strong>{job.type}</strong></div>
          <div><CalendarClock aria-hidden size={21} /><span>마감</span><strong>{deadlineLabel(job.deadline)}</strong></div>
        </aside>
      </section>
    </main>
  );
}
