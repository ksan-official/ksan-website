"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { BusinessMotion } from "@/components/BusinessMotion";
import { businessJobs, type BusinessJob, type JobType } from "@/lib/business";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

const jobTypes: Array<"전체" | JobType> = ["전체", "풀타임", "워킹 스튜던트", "파트타임", "인턴", "계약직"];

const companyGuideSections = [
  {
    body: "KSAN Business Hub는 네덜란드 한인 유학생에게 채용, 인턴십, 기업 행사, 파트너십 정보를 전달하는 기업 안내 채널입니다.",
    href: "#company-contact",
    id: "service",
    items: ["서비스 특징", "이용 혜택"],
    title: "서비스 소개"
  },
  {
    body: "공고를 보내주시면 KSAN 운영진이 회사 소개, 주요 업무, 자격 요건, 지원 방법을 확인한 뒤 학생들이 읽기 좋은 상세 페이지로 정리합니다.",
    href: "/about#contact",
    id: "posting",
    items: ["등록 절차", "신청 양식", "공고 검수"],
    title: "채용공고 등록"
  },
  {
    body: "후원, 제휴, 채용 홍보, 커리어 프로그램 제안은 문의하기를 통해 남겨주세요. 담당자가 확인 후 이메일로 답변드립니다.",
    href: "/about#contact",
    id: "inquiry",
    items: ["문의하기"],
    title: "문의하기"
  }
];

function daysUntil(deadline: string | null) {
  if (!deadline) return null;
  const today = new Date();
  const end = new Date(`${deadline}T23:59:59`);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
}

function deadlineLabel(deadline: string | null) {
  const days = daysUntil(deadline);
  if (days === null) return "상시 채용";
  if (days === 0) return "오늘 마감";
  return `마감 D-${days}`;
}

function JobCard({
  isSaved,
  job,
  onSave
}: {
  isSaved: boolean;
  job: BusinessJob;
  onSave: (job: BusinessJob) => void;
}) {
  return (
    <article className={`business-job-card business-job-card--${job.accent}`} data-job-card>
      <div className="business-job-card-top">
        <span className="business-company-mark" aria-hidden>{job.company.slice(0, 1)}</span>
        <div className="business-job-actions">
          <span className="business-deadline"><CalendarClock aria-hidden size={14} />{deadlineLabel(job.deadline)}</span>
          <button
            aria-label={isSaved ? `${job.title} 저장 취소` : `${job.title} 저장`}
            aria-pressed={isSaved}
            className="business-save-button"
            onClick={() => onSave(job)}
            type="button"
          >
            <Bookmark aria-hidden fill={isSaved ? "currentColor" : "none"} size={16} />
          </button>
        </div>
      </div>
      <a aria-label={`${job.company} ${job.title} 공고 자세히 보기`} className="business-job-main-link" href={`/business/${job.id}`} rel="noreferrer" target="_blank">
        <div className="business-job-heading">
          <p>{job.company}</p>
          <h3>{job.title}</h3>
        </div>
        <div className="business-job-tags">
          <span><MapPin aria-hidden size={13} />{job.location}</span>
          <span><BriefcaseBusiness aria-hidden size={13} />{job.type}</span>
          {(job.tags.length ? job.tags : [job.department]).slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <ArrowUpRight aria-hidden className="business-job-arrow" size={18} />
      </a>
    </article>
  );
}

export function BusinessHubExperience() {
  const router = useRouter();
  const [jobs, setJobs] = useState<BusinessJob[]>(businessJobs);
  const [activeFeatured, setActiveFeatured] = useState(0);
  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState<(typeof jobTypes)[number]>("전체");
  const [location, setLocation] = useState("전체 지역");
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [activeCompanyGuide, setActiveCompanyGuide] = useState("service");
  const [userId, setUserId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [loadNotice, setLoadNotice] = useState<string | null>(null);

  const locations = useMemo(() => ["전체 지역", ...Array.from(new Set(jobs.map((job) => job.location)))], [jobs]);
  const featuredJobs = useMemo(() => {
    const selected = jobs.filter((job) => job.featured).slice(0, 3);
    return selected.length ? selected : jobs.slice(0, 3);
  }, [jobs]);

  useEffect(() => {
    let active = true;
    fetch("/api/business")
      .then(async (response) => {
        const result = (await response.json()) as { error?: string; jobs?: BusinessJob[]; source?: "fallback" | "supabase" };
        return { ok: response.ok, result };
      })
      .then(({ ok, result }) => {
        if (!active) return;
        if (!ok) {
          setJobs([]);
          setLoadNotice(result.error ?? "채용 공고를 불러오지 못했습니다.");
          return;
        }
        setJobs(result.jobs ?? []);
        setLoadNotice(null);
        setActiveFeatured(0);
      })
      .catch(() => {
        if (!active) return;
        setJobs([]);
        setLoadNotice("채용 공고를 불러오지 못했습니다.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (featuredJobs.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveFeatured((current) => (current + 1) % featuredJobs.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [featuredJobs.length]);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const nextUserId = data.session?.user.id ?? null;
      setUserId(nextUserId);
      if (!nextUserId) return;

      const { data: savedItems } = await supabase
        .from("saved_business_items")
        .select("job_id")
        .eq("user_id", nextUserId);
      setSavedJobIds(new Set((savedItems ?? []).map((item: { job_id: string }) => item.job_id)));
    });
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery = !normalizedQuery || `${job.title} ${job.company} ${job.department} ${job.tags.join(" ")}`.toLowerCase().includes(normalizedQuery);
      const matchesType = jobType === "전체" || job.type === jobType;
      const matchesLocation = location === "전체 지역" || job.location === location;
      return matchesQuery && matchesType && matchesLocation;
    });
  }, [jobType, jobs, location, query]);

  const featured = featuredJobs[activeFeatured] ?? featuredJobs[0];

  async function toggleSave(job: BusinessJob) {
    if (!hasSupabaseConfig() || !userId) {
      router.push("/auth");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const isSaved = savedJobIds.has(job.id);
    const nextSaved = new Set(savedJobIds);

    if (isSaved) {
      const { error } = await supabase
        .from("saved_business_items")
        .delete()
        .eq("user_id", userId)
        .eq("job_id", job.id);
      if (error) {
        setSaveNotice("저장을 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      nextSaved.delete(job.id);
      setSaveNotice("저장을 취소했습니다.");
    } else {
      const { error } = await supabase
        .from("saved_business_items")
        .upsert({ job_id: job.id, user_id: userId } as never);
      if (error) {
        setSaveNotice("저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      nextSaved.add(job.id);
      setSaveNotice("마이페이지에 공고를 저장했습니다.");
    }

    setSavedJobIds(nextSaved);
    window.setTimeout(() => setSaveNotice(null), 2400);
  }

  return (
    <main className="business-hub-page" data-business-page id="main">
      <BusinessMotion />

      <section className="business-hub-hero" data-business-hero>
        <div>
          <p className="business-hub-kicker">KSAN Business Hub</p>
          <h1>네덜란드에서 시작하는<br />나의 다음 커리어</h1>
        </div>
        <div className="business-hero-copy">
          <p>학생에게 맞는 인턴십부터 첫 풀타임 기회까지, KSAN이 확인한 공고와 실전 취업 정보를 한곳에서 살펴보세요.</p>
          <a href="#open-roles">채용 공고 보기 <ArrowRight aria-hidden size={18} /></a>
        </div>
      </section>

      {featured ? <section className={`business-featured business-featured--${featured.accent}`} data-featured-rail aria-label="주목할 채용 공고">
        <div className="business-featured-rail" style={{ transform: `translateX(-${activeFeatured * 100}%)` }}>
          {featuredJobs.map((job) => (
            <article className="business-featured-slide" key={job.id}>
              <div className="business-featured-company">
                <span>Highlighted opportunity</span>
                <strong>{job.company}</strong>
              </div>
              <div className="business-featured-role">
                <p>{job.department} · {job.type}</p>
                <h2>{job.title}</h2>
                <div><span><MapPin aria-hidden size={15} />{job.location}</span><span><CalendarClock aria-hidden size={15} />{deadlineLabel(job.deadline)}</span></div>
              </div>
              <a href={`/business/${job.id}`} rel="noreferrer" target="_blank">공고 보기 <ArrowUpRight aria-hidden size={18} /></a>
            </article>
          ))}
        </div>
        <div className="business-featured-controls">
          <div aria-label="하이라이트 공고 선택">
            {featuredJobs.map((job, index) => (
              <button aria-label={`${job.company} 공고 보기`} aria-pressed={activeFeatured === index} key={job.id} onClick={() => setActiveFeatured(index)} type="button" />
            ))}
          </div>
          <span>{String(activeFeatured + 1).padStart(2, "0")} / {String(featuredJobs.length).padStart(2, "0")}</span>
          <button aria-label="이전 공고" onClick={() => setActiveFeatured((activeFeatured - 1 + featuredJobs.length) % featuredJobs.length)} type="button"><ChevronLeft aria-hidden size={18} /></button>
          <button aria-label="다음 공고" onClick={() => setActiveFeatured((activeFeatured + 1) % featuredJobs.length)} type="button"><ChevronRight aria-hidden size={18} /></button>
        </div>
      </section> : null}

      <section className="business-roles" id="open-roles">
        <header className="business-section-heading">
          <div><p>Open roles</p><h2>지금 지원할 수 있는 기회</h2></div>
          <p>관심 있는 직무와 근무 조건을 선택해 나에게 맞는 공고만 빠르게 찾아보세요.</p>
        </header>

        <div className="business-filter-panel">
          <label className="business-search-field">
            <Search aria-hidden size={19} />
            <span>직무 또는 회사 검색</span>
            <input aria-label="직무 또는 회사 검색" onChange={(event) => setQuery(event.target.value)} placeholder="예: Marketing, Data, Northstar" type="search" value={query} />
          </label>
          <label>
            <BriefcaseBusiness aria-hidden size={18} />
            <span>고용 형태</span>
            <select aria-label="고용 형태" onChange={(event) => setJobType(event.target.value as (typeof jobTypes)[number])} value={jobType}>
              {jobTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>
            <MapPin aria-hidden size={18} />
            <span>근무 지역</span>
            <select aria-label="근무 지역" onChange={(event) => setLocation(event.target.value)} value={location}>
              {locations.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="business-filter-summary"><SlidersHorizontal aria-hidden size={17} /><strong>{filteredJobs.length}</strong><span>개의 공고</span></div>
        </div>

        {filteredJobs.length ? (
          <div className="business-jobs-grid">
            {filteredJobs.map((job) => (
              <JobCard isSaved={savedJobIds.has(job.id)} job={job} key={job.id} onSave={toggleSave} />
            ))}
          </div>
        ) : (
          <div className="business-empty-state">
            <Search aria-hidden size={24} />
            <strong>{loadNotice ? "채용 공고를 불러오지 못했어요." : "조건에 맞는 공고가 아직 없어요."}</strong>
            <p>{loadNotice ?? "검색어나 필터를 바꿔 다시 살펴보세요."}</p>
          </div>
        )}
        {saveNotice ? <div className="business-save-notice" role="status">{saveNotice}</div> : null}
      </section>

      <section className="business-career" id="company-guide">
        <header>
          <p>Company guide</p>
          <h2>기업 안내</h2>
          <span>
            채용공고 등록부터 검수, 학생 대상 노출과 제휴 문의까지 Business Hub에서 필요한 흐름을 한눈에 확인할 수 있습니다.
          </span>
        </header>
        <div className="business-career-accordion">
          {companyGuideSections.map((section, index) => {
            const isOpen = activeCompanyGuide === section.id;
            return (
              <article className={isOpen ? "is-open" : ""} key={section.id}>
                <button onClick={() => setActiveCompanyGuide(section.id)} type="button">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{section.title}</strong>
                  <ChevronRight aria-hidden size={20} />
                </button>
                <div>
                  <div>
                    <p>{section.body}</p>
                    <ul className="business-company-guide-list">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <a href={section.href}>
                      자세히 보기 <ArrowUpRight aria-hidden size={15} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="business-company-cta" id="company-contact">
        <div><Sparkles aria-hidden size={22} /><p>For companies & partners</p></div>
        <h2>학생에게 닿아야 할<br />기회가 있으신가요?</h2>
        <p>채용 공고, 인턴십, 기업 행사와 브랜드 협업을 KSAN 학생 커뮤니티에 소개해보세요.</p>
        <a href="/about#contact">공고 등록 및 제휴 문의 <ArrowUpRight aria-hidden size={19} /></a>
        <Building2 aria-hidden className="business-company-mark" />
      </section>
    </main>
  );
}
