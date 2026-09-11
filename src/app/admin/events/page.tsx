"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { getEventStatusByDate, getEventStatusLabel } from "@/lib/events";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AdminEvent = {
  created_at: string;
  description: string | null;
  id: string;
  location: string | null;
  published: boolean;
  registration_target: string | null;
  source?: "database" | "default";
  starts_at: string;
  title: string;
  updated_at: string | null;
};

const eventSections = [
  { id: "all", label: "전체" },
  { id: "upcoming", label: "진행 예정" },
  { id: "past", label: "지난 행사" }
] as const;

type EventSectionId = (typeof eventSections)[number]["id"];

function shortDateTime(value: string) {
  return value.replace("T", " ").slice(0, 16);
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [activeSection, setActiveSection] = useState<EventSectionId>("all");
  const [status, setStatus] = useState("행사를 불러오는 중입니다.");

  const request = useCallback(async (path = "", options: RequestInit = {}) => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");

    return fetch(`/api/admin/events${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` }
    });
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const response = await request();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEvents(result.events);
      setStatus(result.events.length ? "" : "등록된 행사가 없습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "행사를 불러오지 못했습니다.");
    }
  }, [request]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadEvents();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadEvents]);

  const countsBySection = useMemo(() => {
    const counts = new Map<EventSectionId, number>([["all", events.length], ["upcoming", 0], ["past", 0]]);
    events.forEach((event) => {
      const eventStatus = getEventStatusByDate(event.starts_at);
      counts.set(eventStatus, (counts.get(eventStatus) ?? 0) + 1);
    });
    return counts;
  }, [events]);

  const groupedEvents = useMemo(() => {
    const groups = [
      {
        id: "upcoming" as const,
        label: "진행 예정 행사",
        events: events.filter((event) => getEventStatusByDate(event.starts_at) === "upcoming")
      },
      {
        id: "past" as const,
        label: "지난 행사",
        events: events.filter((event) => getEventStatusByDate(event.starts_at) === "past")
      }
    ];

    return groups.filter((group) => activeSection === "all" || group.id === activeSection);
  }, [activeSection, events]);

  async function updateEvent(id: string, published: boolean) {
    const event = events.find((item) => item.id === id);
    if (!event) return;

    const nextStateLabel = published ? "공개" : "비공개";
    if (!window.confirm(`‘${event.title}’ 행사를 ${nextStateLabel}로 전환할까요?`)) return;

    setEvents((current) => current.map((item) => item.id === id ? { ...item, published } : item));
    setStatus(`${nextStateLabel}로 변경하는 중입니다.`);
    const response = await request("", {
      body: JSON.stringify({ id, published }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH"
    });
    const result = await response.json();
    if (!response.ok) {
      setEvents((current) => current.map((item) => item.id === id ? { ...item, published: event.published } : item));
      setStatus(result.error);
      return;
    }
    setStatus(`${nextStateLabel}로 변경했습니다.`);
  }

  async function removeEvent(event: AdminEvent) {
    if (!window.confirm(`‘${event.title}’ 행사를 삭제할까요? 삭제 후에는 복구할 수 없습니다.`)) return;

    setStatus("행사를 삭제하는 중입니다.");
    const response = await request(`?id=${event.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error);
      return;
    }
    await loadEvents();
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Events</p>
          <h1>행사 관리</h1>
          <p>등록된 행사의 공개 상태와 신청 링크를 관리합니다.</p>
        </div>
        <Link className="admin-button" href="/admin/events/new">새 행사 등록</Link>
      </header>

      <section className="admin-section">
        <div className="admin-guide-toolbar">
          <strong>{events.length}개 행사</strong>
          <span>공개 {events.filter((event) => event.published).length}개</span>
        </div>
        <div aria-label="행사 상태" className="admin-filter-buttons" role="tablist">
          {eventSections.map((section) => (
            <button
              aria-pressed={activeSection === section.id}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              {section.label} <small>{countsBySection.get(section.id) ?? 0}</small>
            </button>
          ))}
        </div>
        {status ? <p className="admin-note">{status}</p> : null}
      </section>

      <section className="admin-guide-groups">
        {groupedEvents.some((group) => group.events.length) ? (
          groupedEvents.map((group) => (
            group.events.length ? (
              <section className="admin-guide-group" key={group.id}>
                <header className="admin-guide-group-header">
                  <div>
                    <CalendarDays aria-hidden size={18} />
                    <h2>{group.label}</h2>
                  </div>
                  <strong>{group.events.length}</strong>
                </header>
                <div className="admin-business-list">
                  {group.events.map((event) => {
                    const eventStatus = getEventStatusByDate(event.starts_at);

                    return (
                      <article className="admin-business-row admin-event-row" key={event.id}>
                        <div className="admin-business-row-main">
                          <div className="admin-event-row-meta">
                            <span>{shortDateTime(event.starts_at)}</span>
                            <span className={`admin-event-status-pill is-${eventStatus}`}>
                              {getEventStatusLabel(eventStatus)}
                            </span>
                          </div>
                          <h2>{event.title}</h2>
                        </div>
                        <div className="admin-guide-actions admin-business-state">
                          <Link href={`/admin/events/${event.id}/edit`}>
                            <Pencil aria-hidden size={18} />
                            수정
                          </Link>
                          <button
                            className="admin-text-button"
                            onClick={() => void updateEvent(event.id, !event.published)}
                            type="button"
                          >
                            {event.published ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
                            {event.published ? "비공개" : "공개"}
                          </button>
                          <button className="admin-text-button danger" onClick={() => void removeEvent(event)} type="button">
                            <Trash2 aria-hidden size={18} />
                            삭제
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null
          ))
        ) : (
          <section className="admin-section">
            <p className="admin-note">이 섹션에 등록된 행사가 없습니다.</p>
          </section>
        )}
      </section>
    </main>
  );
}
