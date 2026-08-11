"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bookmark, Briefcase, CalendarCheck, Settings, UserRound } from "lucide-react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type Profile = {
  full_name: string | null;
  school: string | null;
  major: string | null;
  admission_year: number | null;
};

const myPageItems: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
  state: "live" | "pending";
}> = [
  {
    title: "채용 활동",
    description: "지원하거나 저장한 공고를 모읍니다.",
    Icon: Briefcase,
    state: "live"
  },
  {
    title: "신청한 이벤트",
    description: "사이트 내부 폼으로 제출한 신청 내역을 보여줍니다.",
    Icon: CalendarCheck,
    state: "live"
  },
  {
    title: "저장한 가이드",
    description: "나중에 다시 볼 정착가이드를 모읍니다.",
    Icon: Bookmark,
    state: "live"
  },
  {
    title: "프로필",
    description: "이름, 학교, 전공, 입학연도를 관리합니다.",
    Icon: UserRound,
    state: "live"
  },
  {
    title: "커뮤니티 기록",
    description: "익명 커뮤니티 오픈 시 작성글과 댓글을 연결합니다.",
    Icon: Settings,
    state: "pending"
  },
  {
    title: "Pass it On 기록",
    description: "중고거래/나눔 기능 오픈 시 저장·작성 기록을 연결합니다.",
    Icon: Settings,
    state: "pending"
  }
];

export default function MyPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const configured = hasSupabaseConfig();
  const [status, setStatus] = useState<string | null>(
    configured ? null : "계정 기능이 아직 준비 중입니다. 지금은 화면 구조만 확인할 수 있습니다."
  );

  useEffect(() => {
    if (!configured) {
      return;
    }

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
    });
  }, [configured]);

  return (
    <main className="page" id="main">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">My page</p>
          <h1 className="page-title">내 활동이 쌓이는 공간</h1>
          <p className="lead">
            첫 MVP에서는 프로필, 저장한 가이드, 저장한 공고, 신청한 이벤트를 중심으로 시작합니다.
            Pass it On과 Community 기록은 기능 오픈 시 연결합니다.
          </p>
          {!email ? (
            <div className="hero-actions">
              <Link className="button" href="/auth">
                로그인/회원가입
              </Link>
            </div>
          ) : null}
        </div>
        <aside className="ops-board">
          {status ? <p className="status">{status}</p> : null}
          {email ? (
            <section>
              <h2>{profile?.full_name ?? "KSAN 회원"}</h2>
              <p className="muted">{email}</p>
              <p className="muted">
                {profile?.school ?? "학교 미입력"} · {profile?.major ?? "전공 미입력"} ·{" "}
                {profile?.admission_year ?? "입학연도 미입력"}
              </p>
            </section>
          ) : (
            <p className="muted">로그인하면 프로필과 활동 기록이 이곳에 표시됩니다.</p>
          )}
        </aside>
      </section>
      <section className="section">
        <div className="grid">
          {myPageItems.map(({ title, description, Icon, state }) => (
            <section className="card" key={title}>
              <Icon size={22} aria-hidden />
              <span className={state === "live" ? "badge live" : "badge pending"}>
                {state === "live" ? "MVP ready" : "Later"}
              </span>
              <h2>{title}</h2>
              <p className="muted">{description}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
