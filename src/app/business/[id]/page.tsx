import Link from "next/link";
import { isLocalDesignMode } from "@/lib/design-preview";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import styles from "./page.module.css";
import { BusinessDetailActions } from "@/components/BusinessDetailActions";
import { BusinessFormattedBody } from "@/components/BusinessFormattedBody";
import { businessJobs, businessPreviewJobs, composeBusinessDetailText, resolveBusinessDetails, type BusinessJob, type JobType } from "@/lib/business";
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

async function getBusinessJob(id: string) {
  if (isLocalDesignMode) return [...businessPreviewJobs, ...businessJobs].find((job) => job.id === id && !job.isPreviewOnly) ?? null;

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

  return [...businessJobs, ...businessPreviewJobs].find((job) => job.id === id && !job.isPreviewOnly) ?? null;
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
    <main className={styles.page} id="main" lang="ko">
      <Link className={styles.back} href="/business">
        <ArrowLeft aria-hidden size={15} /> 커리어 허브 / 채용 공고
      </Link>

      <header className={styles.header}>
        <p className={styles.company} lang={language}>{job.company}</p>
        <h1 lang={language}>{job.title}</h1>
        <div className={styles.meta}>
          <span>{job.location}</span>
          {job.type !== "공고 확인" ? <span>{job.type}</span> : null}
        </div>
        {job.tags.length ? (
          <div className={styles.tags}>{job.tags.map((tag) => <span key={tag}>#{tag.replace(/^#/, "")}</span>)}</div>
        ) : null}
      </header>

      <aside className={styles.sidebar} aria-label="채용 및 지원 정보">
        <p className={styles.sidebarLabel}>채용 정보</p>
        <h2 lang={language}>{job.company}</h2>
        <dl className={styles.facts}>
          <div><dt>근무지</dt><dd>{job.location}</dd></div>
          {job.type !== "공고 확인" ? <div><dt>고용 형태</dt><dd>{job.type}</dd></div> : null}
          {job.deadline ? <div><dt>지원 마감</dt><dd><time dateTime={job.deadline}>{job.deadline.replaceAll("-", ". ")}</time></dd></div> : null}
        </dl>
        <BusinessDetailActions applyTarget={job.applyTarget} jobId={job.id} />
      </aside>

      <article className={styles.body} aria-label="채용 공고 본문">
        <BusinessFormattedBody body={body} language={language} />
        <Link className={styles.endLink} href="/business">다른 채용 공고 둘러보기 <ArrowUpRight aria-hidden size={17} /></Link>
      </article>
    </main>
  );
}
