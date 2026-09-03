"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Briefcase,
  CalendarCheck,
  MessageCircle,
  Settings,
  Sparkles,
  UserRound
} from "lucide-react";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient, getBrowserSupabaseSession, hasSupabaseConfig } from "@/lib/supabase";

type Profile = {
  avatar_url: string | null;
  full_name: string | null;
};

type MyPageCounts = {
  business: string;
  events: string;
  guides: string;
  profile: string;
};

const myPageItems: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
  state: "live" | "pending";
  href: string;
  countKey: keyof MyPageCounts | null;
}> = [
  {
    title: "채용 활동",
    description: "지원하거나 저장한 공고를 모읍니다.",
    Icon: Briefcase,
    state: "live",
    href: "/mypage/business",
    countKey: "business"
  },
  {
    title: "신청한 이벤트",
    description: "사이트 내부 폼으로 제출한 신청 내역을 보여줍니다.",
    Icon: CalendarCheck,
    state: "live",
    href: "/mypage/events",
    countKey: "events"
  },
  {
    title: "저장한 가이드",
    description: "나중에 다시 볼 정착가이드를 모읍니다.",
    Icon: Bookmark,
    state: "live",
    href: "/mypage/guides",
    countKey: "guides"
  },
  {
    title: "프로필",
    description: "이름, 학교, 전공, 입학연도를 확인합니다.",
    Icon: UserRound,
    state: "live",
    href: "/mypage/profile",
    countKey: "profile"
  },
  {
    title: "커뮤니티 기록",
    description: "익명 커뮤니티 오픈 시 작성글과 댓글을 연결합니다.",
    Icon: MessageCircle,
    state: "pending",
    href: "/mypage/community",
    countKey: null
  },
  {
    title: "Pass it On 기록",
    description: "중고거래/나눔 기능 오픈 시 저장·작성 기록을 연결합니다.",
    Icon: Settings,
    state: "pending",
    href: "/mypage/pass-it-on",
    countKey: null
  }
];

function displayName(profile: Profile | null) {
  return profile?.full_name?.trim() || "회원";
}

function profileInitial(profile: Profile | null) {
  return displayName(profile).slice(0, 1);
}

function Avatar({ profile }: { profile: Profile | null }) {
  return profile?.avatar_url ? (
    <span className="mypage-avatar-image" style={{ backgroundImage: `url("${profile.avatar_url}")` }} />
  ) : (
    profileInitial(profile)
  );
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

export function MyPageHome() {
  const configured = hasSupabaseConfig();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<MyPageCounts>({
    business: "0",
    events: "0",
    guides: "0",
    profile: "1"
  });

  useEffect(() => {
    if (!configured) return;

    let active = true;
    let requestId = 0;
    const supabase = createBrowserSupabaseClient();

    function clearDashboard() {
      requestId += 1;
      setProfile(null);
      setCounts({
        business: "0",
        events: "0",
        guides: "0",
        profile: "0"
      });
    }

    async function loadDashboard(user: User) {
      const currentRequest = ++requestId;
      const fallbackName = authDisplayName(user);
      setProfile((current) => current ?? { avatar_url: null, full_name: fallbackName });

      const [profileResult, savedGuidesCount, savedBusinessCount, applicationsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single(),
        supabase
          .from("saved_guides")
          .select("guide_slug", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("saved_business_items")
          .select("job_id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("applications")
          .select("id, application_type")
          .eq("user_id", user.id)
      ]);

      if (!active || currentRequest !== requestId) return;

      const profileRow = profileResult.data;
      const applicationRows = (applicationsResult.data ?? []) as Array<{ application_type: string }>;
      const businessApplicationCount = applicationRows.filter((item) => item.application_type === "business_application").length;
      const eventApplicationCount = applicationRows.filter((item) => item.application_type === "event_registration").length;

      setCounts({
        business: String((savedBusinessCount.count ?? 0) + businessApplicationCount),
        events: String(eventApplicationCount),
        guides: String(savedGuidesCount.count ?? 0),
        profile: "1"
      });

      if (!profileResult.error) {
        setProfile({
          avatar_url: (profileRow as Profile | null)?.avatar_url ?? null,
          full_name: (profileRow as Profile | null)?.full_name ?? fallbackName
        });
        return;
      }

      const legacyProfileResult = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (!active || currentRequest !== requestId) return;

      const legacyProfileRow = legacyProfileResult.data as { full_name: string | null } | null;

      setProfile({
        avatar_url: null,
        full_name: legacyProfileRow?.full_name ?? fallbackName
      });
    }

    getBrowserSupabaseSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (!user) {
        clearDashboard();
        return;
      }
      void loadDashboard(user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        clearDashboard();
        return;
      }
      void loadDashboard(session.user);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [configured]);

  return (
    <main className="page mypage-page" id="main">
      <section className="mypage-profile-hero">
        <div className="mypage-avatar" aria-hidden>
          <Avatar profile={profile} />
        </div>
        <div>
          <p className="eyebrow">My page</p>
          <h1>안녕하세요, {displayName(profile)}님</h1>
          <p>저장한 정보와 신청 내역을 한 화면에서 넓게 확인하세요.</p>
        </div>
      </section>

      <section className="mypage-dashboard">
        <aside className="mypage-menu" aria-label="마이페이지 메뉴">
          {myPageItems.map(({ title, Icon, href, countKey }, index) => (
            <Link className={index === 0 ? "is-active" : ""} href={href} key={title}>
              <Icon aria-hidden size={18} />
              <span>{title}</span>
              <small>{countKey ? counts[countKey] : "곧"}</small>
            </Link>
          ))}
        </aside>

        <div className="mypage-main-panel">
          <div className="mypage-panel-heading">
            <div>
              <span><Sparkles aria-hidden size={15} /> Activity board</span>
              <h2>필요한 활동만 크게, 빠르게</h2>
            </div>
            <p>채용, 이벤트, 가이드를 카드보다 넓은 행 단위로 정리했습니다.</p>
          </div>

          <div className="mypage-feature-list">
            {myPageItems.slice(0, 4).map(({ title, description, Icon, state, href, countKey }) => (
              <Link className="mypage-feature-row" href={href} key={title}>
                <span className="mypage-feature-icon"><Icon aria-hidden size={21} /></span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
                <span className={state === "live" ? "badge live" : "badge pending"}>
                  {countKey ? counts[countKey] : "곧"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
