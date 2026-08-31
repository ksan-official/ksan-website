"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Bookmark, Briefcase, CalendarCheck, Camera, MessageCircle, Pencil, Settings, UserRound } from "lucide-react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

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

const titles: Record<MyPageSection, string> = {
  profile: "프로필",
  business: "채용 활동",
  events: "신청한 이벤트",
  guides: "저장한 가이드",
  community: "커뮤니티 기록",
  "pass-it-on": "Pass it On 기록"
};

const navigation: Array<{ section: MyPageSection; label: string; Icon: typeof Briefcase }> = [
  { section: "business", label: "채용 활동", Icon: Briefcase },
  { section: "events", label: "신청한 이벤트", Icon: CalendarCheck },
  { section: "guides", label: "저장한 가이드", Icon: Bookmark },
  { section: "profile", label: "프로필", Icon: UserRound },
  { section: "community", label: "커뮤니티 기록", Icon: MessageCircle },
  { section: "pass-it-on", label: "Pass it On 기록", Icon: Settings }
];

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
  const configured = hasSupabaseConfig();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedGuides, setSavedGuides] = useState<SavedGuide[]>([]);
  const [savedBusinessItems, setSavedBusinessItems] = useState<SavedBusinessItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [photoStatus, setPhotoStatus] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [status, setStatus] = useState(configured ? "내역을 불러오는 중입니다." : "계정 기능이 아직 준비 중입니다.");

  useEffect(() => {
    if (!configured) return;

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setStatus("로그인이 필요합니다.");
        return;
      }

      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      const fallbackName = authDisplayName(data.user);
      const profileResult = await supabase
        .from("profiles")
        .select("full_name, school, major, admission_year, avatar_url")
        .eq("id", data.user.id)
        .single();
      let profileRow = profileResult.data as Profile | null;

      if (profileResult.error) {
        const legacyProfileResult = await supabase
          .from("profiles")
          .select("full_name, school, major, admission_year")
          .eq("id", data.user.id)
          .single();
        const legacyProfileRow = legacyProfileResult.data as Omit<Profile, "avatar_url"> | null;
        profileRow = legacyProfileRow ? { ...legacyProfileRow, avatar_url: null } : null;
      }

      setProfile({
        avatar_url: profileRow?.avatar_url ?? null,
        admission_year: profileRow?.admission_year ?? null,
        full_name: profileRow?.full_name ?? fallbackName,
        major: profileRow?.major ?? null,
        school: profileRow?.school ?? null
      });

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
        ? await supabase.from("business_posts").select("id, title, company, apply_mode, apply_target").in("id", businessIds)
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
          detailHref: `/business/${post?.id ?? item.job_id}`,
          jobId: item.job_id,
          title: post?.title ?? "삭제되었거나 찾을 수 없는 공고",
          company: post?.company ?? null,
          savedAt: item.created_at
        };
      }));
      setApplications(applicationRows.map((item) => {
        const businessPost = item.application_type === "business_application" ? businessById.get(item.target_id) : null;
        return {
        detailHref: item.application_type === "business_application" ? `/business/${businessPost?.id ?? item.target_id}` : null,
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

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !configured || !userId) return;

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
    if (!configured || !userId) return;

    const formData = new FormData(event.currentTarget);
    const admissionYear = String(formData.get("admissionYear") ?? "").trim();
    const nextProfile = {
      admission_year: admissionYear ? Number(admissionYear) : null,
      full_name: String(formData.get("fullName") ?? "").trim() || null,
      major: String(formData.get("major") ?? "").trim() || null,
      school: String(formData.get("school") ?? "").trim() || null
    };

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

  return (
    <main className="page mypage-page" id="main">
      <section className="mypage-profile-hero">
        <div className="mypage-avatar" aria-hidden>
          {profile?.avatar_url ? <img alt="" src={profile.avatar_url} /> : displayName(profile).slice(0, 1)}
        </div>
        <div>
          <p className="eyebrow">My page</p>
          <h1>안녕하세요, {displayName(profile)}님</h1>
          <p>{profile?.school ?? "University of Amsterdam"} · {profile?.major ?? "회원 활동"} · {email ?? "로그인 후 더 자세히 볼 수 있어요"}</p>
        </div>
        {!email ? <Link className="mypage-profile-link" href="/auth">로그인/회원가입</Link> : <Link className="mypage-profile-link" href="/mypage">마이페이지 홈</Link>}
      </section>

      <section className="mypage-dashboard">
        <aside className="mypage-menu" aria-label="마이페이지 메뉴">
          {navigation.map(({ section: itemSection, label, Icon }) => (
            <Link className={section === itemSection ? "is-active" : ""} href={`/mypage/${itemSection}`} key={itemSection}>
              <Icon aria-hidden size={18} />
              <span>{label}</span>
              <small>{itemSection === "business" ? savedBusinessItems.length + businessApplications.length : itemSection === "events" ? eventApplications.length : itemSection === "guides" ? savedGuides.length : ""}</small>
            </Link>
          ))}
        </aside>

        <section className="mypage-main-panel">
          {status ? <p className="status">{status}</p> : null}
          {section === "profile" ? (
            <div className="mypage-detail-block">
              <div className="mypage-panel-heading">
                <div><span>Profile</span><h2>프로필</h2></div>
                <p>이름, 학교, 전공 정보를 한눈에 확인하고 필요할 때만 수정합니다.</p>
              </div>
              {!editingProfile ? (
                <div className="mypage-profile-card">
                  <div className="mypage-profile-card-main">
                    <div className="mypage-avatar is-large" aria-hidden>
                      {profile?.avatar_url ? <img alt="" src={profile.avatar_url} /> : displayName(profile).slice(0, 1)}
                    </div>
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
                    <p><span>이름</span>{displayName(profile)}</p>
                    <p><span>학교</span>{profile?.school ?? "학교 미입력"}</p>
                    <p><span>전공</span>{profile?.major ?? "전공 미입력"}</p>
                    <p><span>입학연도</span>{profile?.admission_year ?? "입학연도 미입력"}</p>
                  </div>
                </div>
              ) : (
                <div className="mypage-edit-panel">
                  <div className="mypage-photo-setting">
                    <div className="mypage-avatar is-large" aria-hidden>
                      {profile?.avatar_url ? <img alt="" src={profile.avatar_url} /> : displayName(profile).slice(0, 1)}
                    </div>
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
                      <span>이름</span>
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
            <div className="mypage-detail-block">
              <div className="mypage-panel-heading"><div><span>Career</span><h2>채용 활동</h2></div><p>{savedBusinessItems.length + businessApplications.length}개의 저장/지원 기록</p></div>
              <div className="mypage-feature-list">
                {businessApplications.map((item) => (
                  <Link className="mypage-feature-row" href={item.detailHref ?? "/business"} key={item.id} rel="noreferrer" target="_blank">
                    <span className="mypage-feature-icon"><Briefcase aria-hidden size={21} /></span>
                    <div><strong>지원한 공고</strong><p>{item.targetTitle}{item.targetMeta ? ` · ${item.targetMeta}` : ""} · {new Date(item.submittedAt).toLocaleDateString("ko-KR")}</p></div>
                    <span className="badge live">지원</span>
                  </Link>
                ))}
                {savedBusinessItems.map((item) => (
                  <Link className="mypage-feature-row" href={item.detailHref} key={`${item.jobId}-${item.savedAt}`} rel="noreferrer" target="_blank">
                    <span className="mypage-feature-icon"><Bookmark aria-hidden size={21} /></span>
                    <div><strong>저장한 공고</strong><p>{item.title}{item.company ? ` · ${item.company}` : ""} · {new Date(item.savedAt).toLocaleDateString("ko-KR")}</p></div>
                    <span className="badge live">찜</span>
                  </Link>
                ))}
                {!businessApplications.length && !savedBusinessItems.length ? <p className="muted">아직 저장하거나 지원한 공고가 없습니다.</p> : null}
              </div>
            </div>
          ) : null}
          {section === "events" ? (
            <div className="mypage-detail-block">
              <div className="mypage-panel-heading"><div><span>Events</span><h2>신청한 이벤트</h2></div><p>{eventApplications.length}개</p></div>
              <div className="mypage-feature-list">
                {eventApplications.length ? eventApplications.map((item) => <Link className="mypage-feature-row" href={`/events/${item.targetId}`} key={item.id}><span className="mypage-feature-icon"><CalendarCheck aria-hidden size={21} /></span><div><strong>{item.targetId}</strong><p>{new Date(item.submittedAt).toLocaleDateString("ko-KR")} · {item.syncStatus}</p></div></Link>) : <p className="muted">아직 신청한 이벤트가 없습니다.</p>}
              </div>
            </div>
          ) : null}
          {section === "guides" ? (
            <div className="mypage-detail-block">
              <div className="mypage-panel-heading"><div><span>Guides</span><h2>저장한 가이드</h2></div><p>{savedGuides.length}개</p></div>
              <div className="mypage-feature-list">
                {savedGuides.length ? savedGuides.map((guide) => (
                  <Link className="mypage-feature-row" href={`/guides/${guide.slug}`} key={`${guide.slug}-${guide.savedAt}`}>
                    <span className="mypage-feature-icon"><Bookmark aria-hidden size={21} /></span>
                    <div><strong>{guide.title}</strong><p>{guide.category} · 저장일 {new Date(guide.savedAt).toLocaleDateString("ko-KR")}</p></div>
                  </Link>
                )) : <p className="muted">아직 저장한 가이드가 없습니다.</p>}
              </div>
            </div>
          ) : null}
          {section === "community" ? <div className="mypage-detail-block"><div className="mypage-panel-heading"><div><span>Community</span><h2>커뮤니티 기록</h2></div></div><p className="muted">커뮤니티 글/댓글 기능이 열리면 이곳에 작성 기록이 표시됩니다.</p></div> : null}
          {section === "pass-it-on" ? <div className="mypage-detail-block"><div className="mypage-panel-heading"><div><span>Pass it On</span><h2>Pass it On 기록</h2></div></div><p className="muted">중고거래/나눔 기능이 열리면 이곳에 저장 및 작성 기록이 표시됩니다.</p></div> : null}
        </section>
      </section>
    </main>
  );
}
