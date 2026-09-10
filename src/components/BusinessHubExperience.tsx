"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { BusinessMotion } from "@/components/BusinessMotion";
import { businessJobs, type BusinessJob, type JobType } from "@/lib/business";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

const jobTypes: Array<"전체" | JobType> = ["전체", "풀타임", "워킹 스튜던트", "파트타임", "인턴", "계약직"];
const initialJobCount = 10;

function orderJobs(items: BusinessJob[]) {
  return [...items].sort((left, right) => {
    const leftApproved = left.company === "Samyang Foods Europe" && left.title === "Social Media Specialist (EU)";
    const rightApproved = right.company === "Samyang Foods Europe" && right.title === "Social Media Specialist (EU)";
    if (leftApproved !== rightApproved) return rightApproved ? 1 : -1;
    return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
  });
}

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
    <article className={`business-job-card business-job-card--${job.accent}${job.featured ? " is-approved" : ""}`} data-job-card>
      <div className="business-job-card-top">
        <div className="business-job-identity">
          <span className="business-company-mark" aria-hidden>{job.company.slice(0, 1)}</span>
          {job.featured ? <span className="business-approved-badge">KSAN 승인 포스트</span> : null}
        </div>
        <div className="business-job-actions">
          <span className="business-job-type" data-job-type={job.type}>{job.type}</span>
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
          <span><BriefcaseBusiness aria-hidden size={13} />{job.department}</span>
          {(job.tags.length ? job.tags : [job.department]).slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="business-job-footer">
          <span className="business-deadline"><CalendarClock aria-hidden size={14} />{deadlineLabel(job.deadline)}</span>
          <span className="business-job-open">공고 보기 <ArrowUpRight aria-hidden size={16} /></span>
        </div>
      </a>
    </article>
  );
}

export function BusinessHubExperience() {
  const router = useRouter();
  const [jobs, setJobs] = useState<BusinessJob[]>(() => orderJobs(businessJobs));
  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState<(typeof jobTypes)[number]>("전체");
  const [location, setLocation] = useState("전체 지역");
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [loadNotice, setLoadNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const locations = useMemo(() => ["전체 지역", ...Array.from(new Set(jobs.map((job) => job.location)))], [jobs]);
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
        setJobs(orderJobs(result.jobs ?? []));
        setLoadNotice(null);
      })
      .catch(() => {
        if (!active) return;
        setJobs([]);
        setLoadNotice("채용 공고를 불러오지 못했습니다.");
      });
    return () => { active = false; };
  }, []);

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
      const matchesQuery = !normalizedQuery || `${job.title} ${job.company} ${job.department} ${job.location} ${job.tags.join(" ")}`.toLowerCase().includes(normalizedQuery);
      const matchesType = jobType === "전체" || job.type === jobType;
      const matchesLocation = location === "전체 지역" || job.location === location;
      return matchesQuery && matchesType && matchesLocation;
    });
  }, [jobType, jobs, location, query]);
  const visibleJobs = expanded ? filteredJobs : filteredJobs.slice(0, initialJobCount);

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
        </div>
      </section>

      <section className="business-board-layout" id="open-roles">
        <div className="business-filter-panel" data-business-filter>
          <label className="business-search-field">
            <Search aria-hidden size={19} />
            <span>직무 또는 회사 검색</span>
            <input aria-label="직무 또는 회사 검색" onChange={(event) => { setQuery(event.target.value); setExpanded(false); }} placeholder="예: Talent Acquisition, Picnic" type="search" value={query} />
          </label>
          <label className="business-select-field">
            <BriefcaseBusiness aria-hidden size={18} />
            <span>고용 형태</span>
            <strong aria-hidden>{jobType}</strong>
            <select aria-label="고용 형태" onChange={(event) => { setJobType(event.target.value as (typeof jobTypes)[number]); setExpanded(false); }} value={jobType}>
              {jobTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="business-select-field">
            <MapPin aria-hidden size={18} />
            <span>근무 지역</span>
            <strong aria-hidden>{location}</strong>
            <select aria-label="근무 지역" onChange={(event) => { setLocation(event.target.value); setExpanded(false); }} value={location}>
              {locations.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="business-filter-summary"><SlidersHorizontal aria-hidden size={17} /><strong>{filteredJobs.length}</strong><span>개의 공고</span></div>
        </div>

        <div className="business-board-columns">
          <section className="business-roles">
            {filteredJobs.length ? (
              <div className="business-jobs-grid">
                {visibleJobs.map((job) => (
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
            {filteredJobs.length > initialJobCount ? (
              <div className="business-jobs-expander">
                <button aria-expanded={expanded} onClick={() => setExpanded((current) => !current)} type="button">
                  <span>{expanded ? "공고 접기" : "공고 더 보기"}</span>
                  <small>{expanded ? `처음 ${initialJobCount}개만 보기` : `${filteredJobs.length - initialJobCount}개 더 보기`}</small>
                  <ChevronDown aria-hidden className={expanded ? "is-expanded" : ""} size={18} />
                </button>
              </div>
            ) : null}
            {saveNotice ? <div className="business-save-notice" role="status">{saveNotice}</div> : null}
          </section>

          <aside className="business-board-sidebar" aria-label="기업 파트너 안내" data-business-sidebar>
            <section className="business-guideline-card">
              <p>Post an opportunity</p>
              <h2>채용·커리어 행사 등록</h2>
              <span>귀사의 채용 기회와 커리어 행사를 KSAN의 한인 학생·청년 커뮤니티와 공유해주세요.</span>
              <a href="/about#contact">문의하러 가기 <ArrowRight aria-hidden size={15} /></a>
            </section>

            <section className="business-partnership-card">
              <p>For companies</p>
              <h2>기업 파트너십</h2>
              <span>네덜란드의 우수한 한인 인재와 연결하세요. 채용부터 브랜드 협업까지 KSAN이 함께합니다.</span>
              <ul>
                <li>인재 채용 지원</li>
                <li>현지 행사 지원</li>
                <li>지식 교류 프로그램</li>
              </ul>
              <a href="/about#contact">자세히 알아보기 <ArrowUpRight aria-hidden size={16} /></a>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
