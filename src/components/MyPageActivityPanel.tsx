"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export type MyPageSection = "profile" | "business" | "events" | "guides" | "community" | "pass-it-on";

type Profile = {
  full_name: string | null;
  school: string | null;
  major: string | null;
  admission_year: number | null;
};

type SavedGuide = {
  slug: string;
  title: string;
  category: string;
  savedAt: string;
};

type SavedBusinessItem = {
  jobId: string;
  title: string;
  company: string | null;
  savedAt: string;
};

type ApplicationItem = {
  id: string;
  applicationType: "business_application" | "event_registration";
  targetId: string;
  targetTitle: string;
  targetMeta: string | null;
  submittedAt: string;
  syncStatus: string;
};

type SavedGuideRow = {
  guide_slug: string;
  created_at: string;
};

type GuidePostRow = {
  slug: string;
  title: string;
  category: string;
};

type SavedBusinessItemRow = {
  job_id: string;
  created_at: string;
};

type BusinessPostRow = {
  id: string;
  title: string;
  company: string | null;
};

type ApplicationRow = {
  id: string;
  application_type: "business_application" | "event_registration";
  target_id: string;
  submitted_at: string;
  sheets_sync_status: string;
};

const titles: Record<MyPageSection, string> = {
  profile: "프로필",
  business: "채용 활동",
  events: "신청한 이벤트",
  guides: "저장한 가이드",
  community: "커뮤니티 기록",
  "pass-it-on": "Pass it On 기록"
};

export function MyPageActivityPanel({ section }: { section: MyPageSection }) {
  const configured = hasSupabaseConfig();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedGuides, setSavedGuides] = useState<SavedGuide[]>([]);
  const [savedBusinessItems, setSavedBusinessItems] = useState<SavedBusinessItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [status, setStatus] = useState(configured ? "내역을 불러오는 중입니다." : "계정 기능이 아직 준비 중입니다.");

  useEffect(() => {
    if (!configured) return;

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setStatus("로그인이 필요합니다.");
        return;
      }

      setEmail(data.user.email ?? null);
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("full_name, school, major, admission_year")
        .eq("id", data.user.id)
        .single();
      setProfile(profileRow);

      const [savedGuidesResult, savedBusinessItemsResult, applicationsResult] = await Promise.all([
        supabase.from("saved_guides").select("guide_slug, created_at").eq("user_id", data.user.id).order("created_at", { ascending: false }),
        supabase.from("saved_business_items").select("job_id, created_at").eq("user_id", data.user.id).order("created_at", { ascending: false }),
        supabase.from("applications").select("id, application_type, target_id, submitted_at, sheets_sync_status").eq("user_id", data.user.id).order("submitted_at", { ascending: false })
      ]);

      const savedGuideRows = (savedGuidesResult.data ?? []) as SavedGuideRow[];
      const guideSlugs = savedGuideRows.map((item) => item.guide_slug);
      const { data: guides } = guideSlugs.length
        ? await supabase.from("guide_posts").select("slug, title, category").in("slug", guideSlugs)
        : { data: [] };
      const guideBySlug = new Map(((guides ?? []) as GuidePostRow[]).map((guide) => [guide.slug, guide]));
      const savedBusinessRows = (savedBusinessItemsResult.data ?? []) as SavedBusinessItemRow[];
      const applicationRows = (applicationsResult.data ?? []) as ApplicationRow[];
      const businessIds = Array.from(
        new Set([
          ...savedBusinessRows.map((item) => item.job_id),
          ...applicationRows
            .filter((item) => item.application_type === "business_application")
            .map((item) => item.target_id)
        ].filter(Boolean))
      );
      const { data: businessPosts } = businessIds.length
        ? await supabase.from("business_posts").select("id, title, company").in("id", businessIds)
        : { data: [] };
      const businessById = new Map(((businessPosts ?? []) as BusinessPostRow[]).map((post) => [post.id, post]));

      setSavedGuides(savedGuideRows.map((item) => ({
        slug: item.guide_slug,
        title: guideBySlug.get(item.guide_slug)?.title ?? item.guide_slug,
        category: guideBySlug.get(item.guide_slug)?.category ?? "정착가이드",
        savedAt: item.created_at
      })));
      setSavedBusinessItems(savedBusinessRows.map((item) => {
        const post = businessById.get(item.job_id);
        return {
          jobId: item.job_id,
          title: post?.title ?? "삭제되었거나 찾을 수 없는 공고",
          company: post?.company ?? null,
          savedAt: item.created_at
        };
      }));
      setApplications(applicationRows.map((item) => {
        const businessPost = item.application_type === "business_application" ? businessById.get(item.target_id) : null;
        return {
        id: item.id,
        applicationType: item.application_type,
        targetId: item.target_id,
          targetTitle: businessPost?.title ?? item.target_id,
          targetMeta: businessPost?.company ?? null,
        submittedAt: item.submitted_at,
        syncStatus: item.sheets_sync_status
        };
      }));
      setStatus("");
    });
  }, [configured]);

  const businessApplications = applications.filter((item) => item.applicationType === "business_application");
  const eventApplications = applications.filter((item) => item.applicationType === "event_registration");

  return (
    <main className="page" id="main">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">My page</p>
          <h1 className="page-title">{titles[section]}</h1>
          <p className="lead">회원 활동과 저장 내역을 확인합니다.</p>
          <div className="hero-actions">
            <Link className="button secondary" href="/mypage">마이페이지 홈</Link>
            {!email ? <Link className="button" href="/auth">로그인/회원가입</Link> : null}
          </div>
        </div>
      </section>

      {status ? <p className="status">{status}</p> : null}
      {section === "profile" ? (
        <section className="section">
          <h2>{profile?.full_name ?? "KSAN 회원"}</h2>
          <p className="muted">{email ?? "이메일 정보 없음"}</p>
          <p className="muted">{profile?.school ?? "학교 미입력"} · {profile?.major ?? "전공 미입력"} · {profile?.admission_year ?? "입학연도 미입력"}</p>
        </section>
      ) : null}
      {section === "business" ? (
        <section className="section">
          <div className="section-header"><h2>채용 활동</h2><span className="badge live">{savedBusinessItems.length + businessApplications.length}개</span></div>
          <div className="flow">
            {businessApplications.map((item) => (
              <Link className="flow-step" href="/business" key={item.id}>
                <strong>지원한 공고</strong>
                <p className="muted">{item.targetTitle}{item.targetMeta ? ` · ${item.targetMeta}` : ""} · {new Date(item.submittedAt).toLocaleDateString("ko-KR")}</p>
              </Link>
            ))}
            {savedBusinessItems.map((item) => (
              <Link className="flow-step" href="/business" key={`${item.jobId}-${item.savedAt}`}>
                <strong>저장한 공고</strong>
                <p className="muted">{item.title}{item.company ? ` · ${item.company}` : ""} · {new Date(item.savedAt).toLocaleDateString("ko-KR")}</p>
              </Link>
            ))}
            {!businessApplications.length && !savedBusinessItems.length ? <p className="muted">아직 저장하거나 지원한 공고가 없습니다.</p> : null}
          </div>
        </section>
      ) : null}
      {section === "events" ? (
        <section className="section">
          <div className="section-header"><h2>신청한 이벤트</h2><span className="badge live">{eventApplications.length}개</span></div>
          <div className="flow">
            {eventApplications.length ? eventApplications.map((item) => <div className="flow-step" key={item.id}><strong>{item.targetId}</strong><p className="muted">{new Date(item.submittedAt).toLocaleDateString("ko-KR")} · {item.syncStatus}</p></div>) : <p className="muted">아직 신청한 이벤트가 없습니다.</p>}
          </div>
        </section>
      ) : null}
      {section === "guides" ? (
        <section className="section">
          <div className="section-header"><h2>저장한 가이드</h2><span className="badge live">{savedGuides.length}개</span></div>
          <div className="grid">
            {savedGuides.length ? savedGuides.map((guide) => (
              <Link className="card" href={`/guides/${guide.slug}`} key={`${guide.slug}-${guide.savedAt}`}>
                <Bookmark size={22} aria-hidden />
                <p className="muted">{guide.category}</p>
                <h2>{guide.title}</h2>
                <p className="muted">저장일: {new Date(guide.savedAt).toLocaleDateString("ko-KR")}</p>
              </Link>
            )) : <p className="muted">아직 저장한 가이드가 없습니다.</p>}
          </div>
        </section>
      ) : null}
      {section === "community" ? <section className="section"><h2>커뮤니티 기록</h2><p className="muted">커뮤니티 글/댓글 기능이 열리면 이곳에 작성 기록이 표시됩니다.</p></section> : null}
      {section === "pass-it-on" ? <section className="section"><h2>Pass it On 기록</h2><p className="muted">중고거래/나눔 기능이 열리면 이곳에 저장 및 작성 기록이 표시됩니다.</p></section> : null}
    </main>
  );
}
