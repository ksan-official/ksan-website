"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  CalendarCheck,
  MessageCircle,
  Settings,
  Sparkles,
  UserRound
} from "lucide-react";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type Profile = {
  avatar_url: string | null;
  full_name: string | null;
};

const myPageItems: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
  state: "live" | "pending";
  href: string;
  count: string;
}> = [
  {
    title: "채용 활동",
    description: "지원하거나 저장한 공고를 모읍니다.",
    Icon: Briefcase,
    state: "live",
    href: "/mypage/business",
    count: "12"
  },
  {
    title: "신청한 이벤트",
    description: "사이트 내부 폼으로 제출한 신청 내역을 보여줍니다.",
    Icon: CalendarCheck,
    state: "live",
    href: "/mypage/events",
    count: "6"
  },
  {
    title: "저장한 가이드",
    description: "나중에 다시 볼 정착가이드를 모읍니다.",
    Icon: Bookmark,
    state: "live",
    href: "/mypage/guides",
    count: "14"
  },
  {
    title: "프로필",
    description: "이름, 학교, 전공, 입학연도를 확인합니다.",
    Icon: UserRound,
    state: "live",
    href: "/mypage/profile",
    count: "1"
  },
  {
    title: "커뮤니티 기록",
    description: "익명 커뮤니티 오픈 시 작성글과 댓글을 연결합니다.",
    Icon: MessageCircle,
    state: "pending",
    href: "/mypage/community",
    count: "곧"
  },
  {
    title: "Pass it On 기록",
    description: "중고거래/나눔 기능 오픈 시 저장·작성 기록을 연결합니다.",
    Icon: Settings,
    state: "pending",
    href: "/mypage/pass-it-on",
    count: "곧"
  }
];

function displayName(profile: Profile | null) {
  return profile?.full_name?.trim() || "회원";
}

function profileInitial(profile: Profile | null) {
  return displayName(profile).slice(0, 1);
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

  useEffect(() => {
    if (!configured) return;

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      const fallbackName = authDisplayName(data.user);
      const profileResult = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data.user.id)
        .single();
      const profileRow = profileResult.data;

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
        .eq("id", data.user.id)
        .single();
      const legacyProfileRow = legacyProfileResult.data as { full_name: string | null } | null;

      setProfile({
        avatar_url: null,
        full_name: legacyProfileRow?.full_name ?? fallbackName
      });
    });
  }, [configured]);

  return (
    <main className="page mypage-page" id="main">
      <section className="mypage-profile-hero">
        <div className="mypage-avatar" aria-hidden>
          {profile?.avatar_url ? <img alt="" src={profile.avatar_url} /> : profileInitial(profile)}
        </div>
        <div>
          <p className="eyebrow">My page</p>
          <h1>안녕하세요, {displayName(profile)}님</h1>
          <p>저장한 정보와 신청 내역을 한 화면에서 넓게 확인하세요.</p>
        </div>
        <Link className="mypage-profile-link" href="/mypage/profile">
          프로필 보기 <ArrowRight aria-hidden size={17} />
        </Link>
      </section>

      <section className="mypage-dashboard">
        <aside className="mypage-menu" aria-label="마이페이지 메뉴">
          {myPageItems.map(({ title, Icon, href, count }, index) => (
            <Link className={index === 0 ? "is-active" : ""} href={href} key={title}>
              <Icon aria-hidden size={18} />
              <span>{title}</span>
              <small>{count}</small>
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
            {myPageItems.slice(0, 4).map(({ title, description, Icon, state, href, count }) => (
              <Link className="mypage-feature-row" href={href} key={title}>
                <span className="mypage-feature-icon"><Icon aria-hidden size={21} /></span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
                <span className={state === "live" ? "badge live" : "badge pending"}>
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
