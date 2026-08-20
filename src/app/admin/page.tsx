"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AdminSystemStatus = {
  supabase: boolean;
  databaseReady: boolean;
  guideCount: number;
  businessPostCount: number;
  eventCount: number;
  memberCount: number;
  error?: string;
};

export default function AdminPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [status, setStatus] = useState(
    configured ? "Supabase 설정을 확인하는 중입니다." : "Supabase 환경 변수가 설정되면 관리자 권한을 확인합니다."
  );
  const [systemStatus, setSystemStatus] = useState<AdminSystemStatus | null>(null);

  useEffect(() => {
    if (!configured) return;

    fetch("/api/admin/status")
      .then((response) => response.json())
      .then((nextStatus: AdminSystemStatus) => setSystemStatus(nextStatus))
      .catch(() =>
        setSystemStatus({
          supabase: true,
          databaseReady: false,
          guideCount: 0,
          businessPostCount: 0,
          eventCount: 0,
          memberCount: 0,
          error: "상태를 불러오지 못했습니다."
        })
      );

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setStatus("관리자 로그인이 필요합니다.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      const role = (profile as { role?: string } | null)?.role;

      setStatus(role === "admin" ? "관리자 권한 확인 완료" : "관리자 권한이 없습니다.");
    });
  }, [configured]);

  const dashboardCards = [
    { label: "채용 공고", value: systemStatus?.businessPostCount ?? 0, href: "/admin/business" },
    { label: "정착가이드", value: systemStatus?.guideCount ?? 0, href: "/admin/guides" },
    { label: "행사", value: systemStatus?.eventCount ?? 0, href: "/admin/events/new" },
    { label: "회원", value: systemStatus?.memberCount ?? 0, href: "/admin/members" }
  ];

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">운영 콘솔</p>
          <h1>관리자 페이지</h1>
          <p>공개 사이트와 분리된 내부 작업 공간입니다. 글 등록, 공개 상태, 연동 상태만 봅니다.</p>
        </div>
        <Link className="admin-button" href="/admin/guides">
          정착가이드 관리
        </Link>
      </header>

      <section className="admin-section">
        <h2>현재 상태</h2>
        <div className="admin-status-line">{status}</div>
        {systemStatus?.databaseReady ? (
          <div className="admin-note success">
            DB 연결 완료. 공개/비공개 포함 운영 데이터를 불러오고 있습니다.
          </div>
        ) : (
          <div className="admin-note">
            DB 테이블이 아직 준비되지 않았습니다. Supabase SQL Editor에서{" "}
            <code>supabase/schema.sql</code>을 실행해야 실제 저장 테이블이 생깁니다.
            {systemStatus?.error ? ` (${systemStatus.error})` : null}
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>운영 현황</h2>
        <div className="admin-dashboard-grid">
          {dashboardCards.map((card) => (
            <Link className="admin-dashboard-card" href={card.href} key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>작업 바로가기</h2>
        <div className="admin-action-list">
          <Link href="/admin/guides">
            <strong>정착가이드 관리</strong>
            <span>가이드를 추가·수정하고 공개 여부를 관리</span>
          </Link>
          <Link href="/admin/business">
            <strong>채용 공고 관리</strong>
            <span>공고를 추가·수정하고 공개 여부와 하이라이트 배너 관리</span>
          </Link>
          <Link href="/admin/events/new">
            <strong>행사 등록</strong>
            <span>행사 소개, 신청 방식, 외부 폼 링크 입력</span>
          </Link>
          <Link href="/admin/map-spots">
            <strong>지도 장소 관리</strong>
            <span>카페, 맛집, 공부 스팟을 추가·수정하고 공개 여부 관리</span>
          </Link>
          <Link href="/admin/members">
            <strong>회원 관리</strong>
            <span>가입 회원과 저장·신청 내역 확인</span>
          </Link>
          <Link href="/admin/about/new">
            <strong>소개 항목 수정</strong>
            <span>임원진, 회장단, 후원사 항목 입력</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
