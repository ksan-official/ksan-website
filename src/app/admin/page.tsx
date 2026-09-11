"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasSupabaseConfig } from "@/lib/supabase";

type AdminSystemStatus = {
  supabase: boolean;
  databaseReady: boolean;
  guideCount: number;
  businessPostCount: number;
  eventCount: number;
  memberCount: number;
  recentMemberCount?: number;
  upcomingEvents?: Array<{ href: string; id: string; published: boolean; startsAt: string; title: string }>;
  urgentBusinessPosts?: Array<{ company: string; deadline: string; href: string; id: string; published: boolean; title: string }>;
  newMembers?: Array<{ createdAt: string; email: string; id: string; name: string; school: string }>;
  error?: string;
};

function shortDate(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function deadlineLabel(value?: string) {
  if (!value) return "마감일 없음";

  const target = new Date(`${value.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayDiff = Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (dayDiff < 0) return "마감 지남";
  if (dayDiff === 0) return "오늘 마감";
  return `D-${dayDiff}`;
}

export default function AdminPage() {
  const configured = hasSupabaseConfig();
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

  }, [configured]);

  const dashboardCards = [
    { label: "채용 공고", value: systemStatus?.businessPostCount ?? 0, href: "/admin/business" },
    { label: "정착가이드", value: systemStatus?.guideCount ?? 0, href: "/admin/guides" },
    { label: "행사", value: systemStatus?.eventCount ?? 0, href: "/admin/events" },
    { label: "회원", value: systemStatus?.memberCount ?? 0, delta: systemStatus?.recentMemberCount ?? 0, showDelta: true, href: "/admin/members" }
  ];
  const quickActions = [
    { label: "새 가이드", href: "/admin/guides/new" },
    { label: "채용 공고", href: "/admin/business/new" },
    { label: "행사 등록", href: "/admin/events/new" }
  ];

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <h1>운영 현황</h1>
        </div>
      </header>

      <section className="admin-section">
        {systemStatus && !systemStatus.databaseReady ? (
          <p className="admin-note">{systemStatus.error ?? "Supabase 테이블 상태를 확인해주세요."}</p>
        ) : null}
        <div className="admin-dashboard-grid admin-dashboard-grid--primary">
          {dashboardCards.map((card) => (
            <Link className="admin-dashboard-card" href={card.href} key={card.label}>
              <span>{card.label}</span>
              <div className="admin-dashboard-card-value">
                <strong>{card.value}</strong>
                {card.showDelta ? <em>최근 7일 +{card.delta ?? 0}</em> : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-dashboard-layout">
        <div className="admin-dashboard-panel">
          <div className="admin-panel-heading">
            <span>일정</span>
            <h2>다가오는 행사</h2>
          </div>
          <div className="admin-dashboard-list">
            {systemStatus?.upcomingEvents?.length ? systemStatus.upcomingEvents.map((event) => (
              <Link href={event.href} key={event.id}>
                <span>{event.published ? "공개" : "비공개"}</span>
                <strong>{event.title}</strong>
                <small>{shortDate(event.startsAt)}</small>
              </Link>
            )) : <p>예정된 행사가 없습니다.</p>}
          </div>
        </div>

        <div className="admin-dashboard-panel">
          <div className="admin-panel-heading">
            <span>D-7</span>
            <h2>마감 임박 채용</h2>
          </div>
          <div className="admin-dashboard-list">
            {systemStatus?.urgentBusinessPosts?.length ? systemStatus.urgentBusinessPosts.map((post) => (
              <Link href={post.href} key={post.id}>
                <span className="admin-deadline-pill">{deadlineLabel(post.deadline)}</span>
                <strong>{post.title}</strong>
                <small>{post.company ? `${post.company} · ` : ""}{shortDate(post.deadline)}</small>
              </Link>
            )) : <p>7일 안에 마감되는 공고가 없습니다.</p>}
          </div>
        </div>

        <div className="admin-dashboard-panel">
          <div className="admin-panel-heading">
            <span>최근 7일</span>
            <h2>신규 회원</h2>
          </div>
          <div className="admin-dashboard-list">
            {systemStatus?.newMembers?.length ? systemStatus.newMembers.map((member) => (
              <Link href="/admin/members" key={member.id}>
                <span>{member.school || "학교 미입력"}</span>
                <strong>{member.name}</strong>
                <small>{shortDate(member.createdAt)}</small>
              </Link>
            )) : <p>최근 가입한 회원이 없습니다.</p>}
          </div>
        </div>

        <div className="admin-dashboard-panel admin-dashboard-panel--quick">
          <div className="admin-panel-heading">
            <span>바로가기</span>
            <h2>빠른 작업</h2>
          </div>
          <div className="admin-quick-actions">
            {quickActions.map((action) => (
              <Link href={action.href} key={action.href}>{action.label}</Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
