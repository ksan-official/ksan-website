"use client";

import Link from "next/link";
import { designProfile, designSavedGuides, isLocalDesignMode } from "@/lib/design-preview";
import { businessJobs } from "@/lib/business";
import { ksanEvents } from "@/lib/events";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { ArrowUpRight, Bookmark, Briefcase, CalendarCheck, Camera, MapPin, Pencil } from "lucide-react";
import { useMyPageSearch } from "@/components/MyPageWorkspace";
import styles from "@/components/MyPageWorkspace.module.css";
import { LocalActivityBoard } from "@/components/LocalActivityBoard";
import { createBrowserSupabaseClient, getBrowserSupabaseSession, hasSupabaseConfig } from "@/lib/supabase";

export type MyPageSection = "profile" | "business" | "events" | "guides" | "community" | "pass-it-on";

type Profile = {
  avatar_url: string | null;
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
  detailHref: string;
  jobId: string;
  title: string;
  company: string | null;
  savedAt: string;
};

type ApplicationItem = {
  detailHref: string | null;
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

type LegacySavedBusinessPostRow = {
  business_post_id: string;
  created_at: string;
};

type BusinessPostRow = {
  apply_mode?: "email" | "external_link" | "internal_form" | null;
  apply_target?: string | null;
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

type EventRow = {
  id: string;
  title: string;
  location: string | null;
};

const titles: Record<MyPageSection, string> = {
  profile: "프로필",
  business: "채용 활동",
  events: "신청한 이벤트",
  guides: "저장한 가이드",
  community: "케이숲 기록",
  "pass-it-on": "중고거래 기록"
};

function displayName(profile: Profile | null) {
  return profile?.full_name?.trim() || "회원";
}

function authDisplayName(user: User) {
  const metadata = user.user_metadata as {
    full_name?: unknown;
    name?: unknown;
  };
  const metadataName = typeof metadata.full_name === "string" ? metadata.full_name : metadata.name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "";
}

function ProfileAvatar({ profile, large = false }: { profile: Profile | null; large?: boolean }) {
  return (
    <div className={large ? "mypage-avatar is-large" : "mypage-avatar"} aria-hidden>
      {profile?.avatar_url ? (
        <span className="mypage-avatar-image" style={{ backgroundImage: `url("${profile.avatar_url}")` }} />
      ) : (
        displayName(profile).slice(0, 1)
      )}
    </div>
  );
}

async function profileRequest(formData: FormData) {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return { error: "로그인이 필요합니다." };
  }

  const response = await fetch("/api/profile", {
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`
    },
    method: "PATCH"
  });
  const result = (await response.json()) as {
    avatarUrl?: string | null;
    error?: string;
    warning?: string;
  };

  if (!response.ok) {
    return { error: result.error ?? "프로필 저장에 실패했어요." };
  }

  return result;
}

export function MyPageActivityPanel({ section }: { section: MyPageSection }) {
  const router = useRouter();
  const query = useMyPageSearch().trim().toLocaleLowerCase();
  const [careerTab, setCareerTab] = useState<"saved" | "applied">("saved");
  const configured = !isLocalDesignMode && hasSupabaseConfig();
  const [email, setEmail] = useState<string | null>(isLocalDesignMode ? "member@example.com" : null);
  const [profile, setProfile] = useState<Profile | null>(isLocalDesignMode ? designProfile : null);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedGuides, setSavedGuides] = useState<SavedGuide[]>(isLocalDesignMode ? designSavedGuides : []);
  const [savedBusinessItems, setSavedBusinessItems] = useState<SavedBusinessItem[]>(isLocalDesignMode ? businessJobs.slice(0, 2).map((job) => ({
    detailHref: `/business/${job.id}`, jobId: job.id, title: job.title, company: job.company, savedAt: "2026-10-18T12:00:00Z"
  })) : []);
  const [applications, setApplications] = useState<ApplicationItem[]>(isLocalDesignMode ? [{
    detailHref: `/events/${ksanEvents[0].id}`, id: "design-event", applicationType: "event_registration", targetId: ksanEvents[0].id, targetTitle: ksanEvents[0].title, targetMeta: ksanEvents[0].location, submittedAt: "2026-10-18T12:00:00Z", syncStatus: "신청 완료"
  }] : []);
  const [photoStatus, setPhotoStatus] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out">(
    configured ? "checking" : "signed-out"
  );
  const [status, setStatus] = useState(isLocalDesignMode ? "" : configured ? "내역을 불러오는 중입니다." : "계정 기능이 아직 준비 중입니다.");

  useEffect(() => {
    if (!configured) return;

    let active = true;
    let requestId = 0;
    const supabase = createBrowserSupabaseClient();

    function clearSignedOut() {
      requestId += 1;
      setUserId(null);
      setEmail(null);
      setProfile(null);
      setSavedGuides([]);
      setSavedBusinessItems([]);
      setApplications([]);
      setAuthState("signed-out");
      setStatus("로그인이 필요합니다.");
    }

    async function loadActivity(user: User) {
      const currentRequest = ++requestId;
      const fallbackName = authDisplayName(user);

      setAuthState("signed-in");
      setUserId(user.id);
      setEmail(user.email ?? null);
      setProfile((current) => current ?? {
        avatar_url: null,
        admission_year: null,
        full_name: fallbackName,
        major: null,
        school: null
      });
      setStatus("내역을 불러오는 중입니다.");

      try {
        const profileResult = await supabase
          .from("profiles")
          .select("full_name, school, major, admission_year, avatar_url")
          .eq("id", user.id)
          .single();
        let profileRow = profileResult.data as Profile | null;

        if (profileResult.error) {
          const legacyProfileResult = await supabase
            .from("profiles")
            .select("full_name, school, major, admission_year")
            .eq("id", user.id)
            .single();
          const legacyProfileRow = legacyProfileResult.data as Omit<Profile, "avatar_url"> | null;
          profileRow = legacyProfileRow ? { ...legacyProfileRow, avatar_url: null } : null;
        }

        if (!active || currentRequest !== requestId) return;

        setProfile({
          avatar_url: profileRow?.avatar_url ?? null,
          admission_year: profileRow?.admission_year ?? null,
          full_name: profileRow?.full_name ?? fallbackName,
          major: profileRow?.major ?? null,
          school: profileRow?.school ?? null
        });

        const [savedGuidesResult, savedBusinessItemsResult, legacySavedBusinessResult, applicationsResult] = await Promise.all([
          supabase.from("saved_guides").select("guide_slug, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("saved_business_items").select("job_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("saved_business_posts").select("business_post_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("applications").select("id, application_type, target_id, submitted_at, sheets_sync_status").eq("user_id", user.id).order("submitted_at", { ascending: false })
        ]);

        const savedGuideRows = (savedGuidesResult.data ?? []) as SavedGuideRow[];
        const guideSlugs = savedGuideRows.map((item) => item.guide_slug);
        const { data: guides } = guideSlugs.length
          ? await supabase.from("guide_posts").select("slug, title, category").in("slug", guideSlugs)
          : { data: [] };
        const guideBySlug = new Map(((guides ?? []) as GuidePostRow[]).map((guide) => [guide.slug, guide]));
        const legacySavedBusinessRows = (legacySavedBusinessResult.data ?? []) as LegacySavedBusinessPostRow[];
        const savedBusinessRows = [
          ...((savedBusinessItemsResult.data ?? []) as SavedBusinessItemRow[]),
          ...legacySavedBusinessRows.map((item) => ({
            created_at: item.created_at,
            job_id: item.business_post_id
          }))
        ].filter((item, index, items) => items.findIndex((match) => match.job_id === item.job_id) === index);
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
          ? await supabase.from("business_posts").select("id, title, company, apply_mode, apply_target").in("id", businessIds)
          : { data: [] };
        const businessById = new Map(((businessPosts ?? []) as BusinessPostRow[]).map((post) => [post.id, post]));
        const eventIds = Array.from(new Set(applicationRows.filter((item) => item.application_type === "event_registration").map((item) => item.target_id)));
        const { data: events } = eventIds.length
          ? await supabase.from("events").select("id, title, location").in("id", eventIds)
          : { data: [] };
        const eventById = new Map(((events ?? []) as EventRow[]).map((event) => [event.id, event]));

        if (!active || currentRequest !== requestId) return;

        setSavedGuides(savedGuideRows.map((item) => ({
          slug: item.guide_slug,
          title: guideBySlug.get(item.guide_slug)?.title ?? item.guide_slug,
          category: guideBySlug.get(item.guide_slug)?.category ?? "정착가이드",
          savedAt: item.created_at
        })));
        setSavedBusinessItems(savedBusinessRows.map((item) => {
          const post = businessById.get(item.job_id);
          return {
            detailHref: `/business/${post?.id ?? item.job_id}`,
            jobId: item.job_id,
            title: post?.title ?? "삭제되었거나 찾을 수 없는 공고",
            company: post?.company ?? null,
            savedAt: item.created_at
          };
        }));
        setApplications(applicationRows.map((item) => {
          const businessPost = item.application_type === "business_application" ? businessById.get(item.target_id) : null;
          const event = item.application_type === "event_registration" ? eventById.get(item.target_id) : null;
          return {
            detailHref: item.application_type === "business_application" ? `/business/${businessPost?.id ?? item.target_id}` : `/events/${event?.id ?? item.target_id}`,
            id: item.id,
            applicationType: item.application_type,
            targetId: item.target_id,
            targetTitle: businessPost?.title ?? event?.title ?? item.target_id,
            targetMeta: businessPost?.company ?? event?.location ?? null,
            submittedAt: item.submitted_at,
            syncStatus: item.sheets_sync_status
          };
        }));
        setStatus("");
      } catch {
        if (!active || currentRequest !== requestId) return;
        setStatus("내역을 불러오지 못했습니다.");
      }
    }

    getBrowserSupabaseSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (!user) {
        clearSignedOut();
        router.replace(`/auth?next=/mypage/${section}`);
        return;
      }
      void loadActivity(user);
    }).catch(() => {
      if (!active) return;
      setStatus("로그인 상태를 확인하지 못했습니다.");
      router.replace(`/auth?next=/mypage/${section}`);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (!session?.user) {
        if (event === "SIGNED_OUT") {
          clearSignedOut();
          router.replace(`/auth?next=/mypage/${section}`);
        }
        return;
      }
      void loadActivity(session.user);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [configured, router, section]);

  if (configured && authState === "checking") {
    return (
      <main className="page mypage-page" id="main">
        <section className="mypage-auth-check" aria-live="polite">
          <span>계정 확인 중</span>
          <p>로그인 세션을 확인하고 있습니다.</p>
        </section>
      </main>
    );
  }

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (isLocalDesignMode) {
      setPhotoStatus("사진이 선택되었습니다.");
      return;
    }
    if (!configured || !userId) return;

    if (!file.type.startsWith("image/")) {
      setPhotoStatus("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    setUploadingPhoto(true);
    setPhotoStatus("프로필 사진을 저장하는 중입니다.");
    const previewUrl = URL.createObjectURL(file);

    const formData = new FormData();
    formData.set("photo", file);
    formData.set("fullName", profile?.full_name ?? "");
    formData.set("school", profile?.school ?? "");
    formData.set("major", profile?.major ?? "");
    formData.set("admissionYear", profile?.admission_year ? String(profile.admission_year) : "");
    const result = await profileRequest(formData);
    setUploadingPhoto(false);

    if (result.error) {
      URL.revokeObjectURL(previewUrl);
      setPhotoStatus(result.error);
      return;
    }

    setProfile((current) => ({
      avatar_url: result.avatarUrl ?? previewUrl,
      admission_year: current?.admission_year ?? null,
      full_name: current?.full_name ?? null,
      major: current?.major ?? null,
      school: current?.school ?? null
    }));
    setPhotoStatus("프로필 사진이 저장됐어요.");
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLocalDesignMode && (!configured || !userId)) return;

    const formData = new FormData(event.currentTarget);
    const admissionYear = String(formData.get("admissionYear") ?? "").trim();
    const nextProfile = {
      admission_year: admissionYear ? Number(admissionYear) : null,
      full_name: String(formData.get("fullName") ?? "").trim() || null,
      major: String(formData.get("major") ?? "").trim() || null,
      school: String(formData.get("school") ?? "").trim() || null
    };

    if (isLocalDesignMode) {
      setProfile((current) => ({ avatar_url: current?.avatar_url ?? null, ...nextProfile }));
      setEditingProfile(false);
      setProfileStatus("");
      return;
    }
    setSavingProfile(true);
    setProfileStatus("프로필을 저장하는 중입니다.");

    const requestData = new FormData();
    requestData.set("fullName", nextProfile.full_name ?? "");
    requestData.set("school", nextProfile.school ?? "");
    requestData.set("major", nextProfile.major ?? "");
    requestData.set("admissionYear", nextProfile.admission_year ? String(nextProfile.admission_year) : "");
    const result = await profileRequest(requestData);
    setSavingProfile(false);

    if (result.error) {
      setProfileStatus(result.error);
      return;
    }

    setProfile((current) => ({
      avatar_url: current?.avatar_url ?? null,
      ...nextProfile
    }));
    setProfileStatus("프로필이 저장됐어요.");
    setEditingProfile(false);
  }

  const businessApplications = applications.filter((item) => item.applicationType === "business_application");
  const eventApplications = applications.filter((item) => item.applicationType === "event_registration");
  const matchesSearch = (...values: (string | null)[]) => values.join(" ").toLocaleLowerCase().includes(query);
  const visibleJobs = savedBusinessItems.filter((item) => matchesSearch(item.title, item.company));
  const visibleApplications = businessApplications.filter((item) => matchesSearch(item.targetTitle, item.targetMeta));
  const visibleEvents = eventApplications.filter((item) => matchesSearch(item.targetTitle, item.targetMeta));
  const visibleGuides = savedGuides.filter((item) => matchesSearch(item.title, item.category));

  return (
    <main className={styles.content} id="main">
      <h1 className={styles.heading}>{section === "business" ? "채용 활동" : titles[section]}</h1>
      <section className={styles.panel} aria-label={titles[section]}>
          {status ? <p className="status">{status}</p> : null}
          {section === "profile" ? (
            <div className="mypage-detail-block">

              {isLocalDesignMode ? <div className="mypage-profile-actions">
                <span className="badge pending">미인증</span>
                <Link className="mypage-edit-button" href="/auth/verify">신분 인증하기</Link>
              </div> : null}
              {!editingProfile ? (
                <div className="mypage-profile-card">
                  <div className="mypage-profile-card-main">
                    <ProfileAvatar profile={profile} large />
                    <div>
                      <span>현재 프로필</span>
                      <h3>{displayName(profile)}님</h3>
                      <p>{email ?? "로그인 후 프로필을 저장할 수 있어요"}</p>
                    </div>
                  </div>
                  <button className="mypage-edit-button" disabled={!email} onClick={() => setEditingProfile(true)} type="button">
                    <Pencil aria-hidden size={16} />
                    수정
                  </button>
                  <div className="mypage-profile-grid is-compact">
                    <p><span>{isLocalDesignMode ? "닉네임" : "이름"}</span>{displayName(profile)}</p>
                    <p><span>학교</span>{profile?.school ?? "등록 전"}</p>
                    <p><span>전공</span>{profile?.major ?? "등록 전"}</p>
                    <p><span>입학연도</span>{profile?.admission_year ?? "등록 전"}</p>
                  </div>
                </div>
              ) : (
                <div className="mypage-edit-panel">
                  <div className="mypage-photo-setting">
                    <ProfileAvatar profile={profile} large />
                    <div>
                      <strong>프로필 사진</strong>
                      <p>마이페이지와 회원 프로필에 보여질 사진을 설정합니다.</p>
                    </div>
                    <label className="mypage-photo-button">
                      <Camera aria-hidden size={17} />
                      {uploadingPhoto ? "업로드 중" : "사진 선택"}
                      <input accept="image/*" disabled={!email || uploadingPhoto} onChange={handleProfilePhotoChange} type="file" />
                    </label>
                  </div>
                  {photoStatus ? <p className="mypage-photo-status">{photoStatus}</p> : null}
                  <form className="mypage-profile-form" onSubmit={handleProfileSubmit}>
                    <label>
                      <span>{isLocalDesignMode ? "닉네임" : "이름"}</span>
                      <input defaultValue={profile?.full_name ?? ""} name="fullName" placeholder="예: 김민지" />
                    </label>
                    <label>
                      <span>학교</span>
                      <input defaultValue={profile?.school ?? ""} name="school" placeholder="University of Amsterdam" />
                    </label>
                    <label>
                      <span>전공</span>
                      <input defaultValue={profile?.major ?? ""} name="major" placeholder="Business Administration" />
                    </label>
                    <label>
                      <span>입학연도</span>
                      <input defaultValue={profile?.admission_year ?? ""} inputMode="numeric" name="admissionYear" placeholder="2024" />
                    </label>
                    <div className="mypage-profile-actions">
                      <button className="mypage-profile-save" disabled={!email || savingProfile} type="submit">
                        {savingProfile ? "저장 중" : "프로필 저장"}
                      </button>
                      <button className="mypage-cancel-button" onClick={() => setEditingProfile(false)} type="button">
                        취소
                      </button>
                    </div>
                  </form>
                  {profileStatus ? <p className="mypage-photo-status">{profileStatus}</p> : null}
                </div>
              )}
            </div>
          ) : null}
          {section === "business" ? (
            <div>
              <div className={styles.tabs} role="tablist" aria-label="채용 활동 구분" onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const nextTab = event.key === "Home" ? "saved" : event.key === "End" ? "applied" : careerTab === "saved" ? "applied" : "saved";
                setCareerTab(nextTab);
                event.currentTarget.querySelector<HTMLButtonElement>(`#career-${nextTab}-tab`)?.focus();
              }}>
                <button id="career-saved-tab" type="button" role="tab" tabIndex={careerTab === "saved" ? 0 : -1} aria-selected={careerTab === "saved"} aria-controls="career-items" onClick={() => setCareerTab("saved")}>저장한 공고 <span>{savedBusinessItems.length}</span></button>
                <button id="career-applied-tab" type="button" role="tab" tabIndex={careerTab === "applied" ? 0 : -1} aria-selected={careerTab === "applied"} aria-controls="career-items" onClick={() => setCareerTab("applied")}>지원 내역 <span>{businessApplications.length}</span></button>
              </div>
              <div className={styles.cards} id="career-items" role="tabpanel" aria-labelledby={`career-${careerTab}-tab`}>
                {careerTab === "saved" ? visibleJobs.map((item) => {
                  const job = businessJobs.find((job) => job.id === item.jobId);
                  return <Link className={styles.jobCard} href={item.detailHref} key={item.jobId}>
                    <div className={styles.companyTile}>
                      <strong aria-hidden>{(item.company ?? "KSAN").split(" ").map((word) => word[0]).slice(0, 2).join("")}</strong>
                    </div>
                    <div className={styles.jobBody}>
                      <div className={styles.cardTop}><span className={styles.companyName}>{item.company}</span><Bookmark size={17} className={styles.savedMark} aria-label="저장한 공고" /></div>
                      <h2>{item.title}</h2>
                      <div className={styles.jobMeta}><span><MapPin size={14} aria-hidden />{job?.location ?? "지역은 공고에서 확인"}</span>{job?.type && <span>{job.type}</span>}<span className={styles.viewJob}>공고 보기 <ArrowUpRight size={17} aria-hidden /></span></div>
                    </div>
                  </Link>;
                }) : visibleApplications.map((item) => <Link className={styles.applicationCard} href={item.detailHref ?? "/business"} key={item.id}><span className={styles.applicationIcon}><Briefcase size={24} aria-hidden /></span><div><span className={styles.applicationLabel}>지원 완료 · {new Date(item.submittedAt).toLocaleDateString("ko-KR")}</span><h2>{item.targetTitle}</h2><p>{item.targetMeta}</p></div><span className={styles.viewJob}>공고 보기 <ArrowUpRight size={17} aria-hidden /></span></Link>)}
                {(careerTab === "saved" ? !visibleJobs.length : !visibleApplications.length) && <div className={styles.empty}><Bookmark size={28} strokeWidth={1.3} aria-hidden /><h2>{query ? "검색 결과가 없어요" : careerTab === "saved" ? "저장한 공고가 없어요" : "아직 지원 내역이 없어요"}</h2><p>{query ? "다른 검색어로 찾아보세요." : "관심 있는 채용 공고를 찾아보세요."}</p>{!query && <Link href="/business">채용 공고 둘러보기 <ArrowUpRight size={15} aria-hidden /></Link>}</div>}
              </div>
            </div>
          ) : null}
          {section === "events" ? (
            <div className={styles.cards}>
              {visibleEvents.length ? visibleEvents.map((item) => {
                const event = ksanEvents.find((event) => event.id === item.targetId);
                const location = event?.city ?? item.targetMeta?.split(/[\n(]/)[0]?.replace(/^\d+부:\s*/, "").trim();
                return <Link className={styles.eventCard} href={item.detailHref ?? `/events/${item.targetId}`} key={item.id}>
                  <span className={styles.eventPhoto} style={event?.image ? { backgroundImage: `url("${event.image}")` } : undefined} aria-hidden>{!event?.image && <CalendarCheck size={24} strokeWidth={1.3} />}</span>
                  <div className={styles.eventInfo}>
                    <strong>{item.targetTitle}</strong>
                    <p>{event ? event.dateLabel : `신청일 ${new Date(item.submittedAt).toLocaleDateString("ko-KR")}`}{location ? ` · ${location}` : ""}</p>
                  </div>
                  <span className={styles.eventStatus}>신청 완료</span>
                  <ArrowUpRight size={18} className={styles.eventArrow} aria-hidden />
                </Link>;
              }) : <p className="muted">신청한 행사가 없어요.</p>}
            </div>
          ) : null}
          {section === "guides" ? (
            <div className="mypage-detail-block">
              <div className="mypage-panel-heading"><div><span>Guides</span><h2>저장한 가이드</h2></div><p>{savedGuides.length}개</p></div>
              <div className="mypage-feature-list">
                {visibleGuides.length ? visibleGuides.map((guide) => (
                  <Link className="mypage-feature-row" href={`/guides/${guide.slug}`} key={`${guide.slug}-${guide.savedAt}`}>
                    <span className="mypage-feature-icon"><Bookmark aria-hidden size={21} /></span>
                    <div><strong>{guide.title}</strong><p>{guide.category} · 저장일 {new Date(guide.savedAt).toLocaleDateString("ko-KR")}</p></div>
                  </Link>
                )) : <p className="muted">표시할 가이드가 없습니다.</p>}
              </div>
            </div>
          ) : null}
          {section === "community" || section === "pass-it-on" ? (
            isLocalDesignMode ? <LocalActivityBoard key={section} kind={section === "community" ? "community" : "market"} history /> : <p className="muted">아직 활동 내역이 없습니다.</p>
          ) : null}
        </section>
    </main>
  );
}
