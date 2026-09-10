import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { ArchiveEventDetail } from "@/components/ArchiveEventDetail";
import { getKsanEvent, ksanEvents } from "@/lib/events";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function validExternalUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function getRegistrationTarget(title: string, fallback?: string) {
  const fallbackTarget = validExternalUrl(fallback);
  if (!hasSupabaseConfig()) return fallbackTarget;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("events")
      .select("registration_target")
      .eq("title", title)
      .eq("published", true)
      .eq("registration_mode", "google_form")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return fallbackTarget;
    return validExternalUrl((data as { registration_target?: string | null } | null)?.registration_target) ?? fallbackTarget;
  } catch {
    return fallbackTarget;
  }
}

export function generateStaticParams() {
  return ksanEvents.map((event) => ({ id: event.id }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getKsanEvent(id);

  if (!event) {
    notFound();
  }

  if (event.status === "past") {
    return <ArchiveEventDetail event={event} />;
  }

  const organizerName = event.organizerName ?? "KSAN";
  const organizerLogo = event.organizerLogo;
  const registrationTarget = await getRegistrationTarget(event.title, event.registrationTarget);
  const descriptionParagraphs = event.description.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <main className="event-detail-page" id="main">
      <Link className="event-detail-back" href="/events"><ArrowLeft aria-hidden size={18} />행사 목록</Link>
      <section className="event-detail-profile">
        <div
          aria-label={`${event.title} 행사 대표 이미지`}
          className="event-detail-cover"
          data-protected-event-image
          role="img"
          style={{ backgroundImage: `url(${event.image})` }}
        />
        <div className="event-organizer-logo" data-protected-event-image>
          {organizerLogo ? (
            <Image alt={`${organizerName} 주최자 로고`} height={120} src={organizerLogo} width={120} />
          ) : (
            <span className="event-organizer-monogram">{organizerName}</span>
          )}
        </div>
        <div className="event-detail-intro">
          <p className="event-organizer-name"><span>주최</span><strong>{organizerName}</strong></p>
          <p className="eyebrow">{event.keywords.join(" · ")}</p>
          <h1>{event.title}</h1>
          <p className="event-detail-summary">{event.summary}</p>
        </div>
      </section>

      <section className="event-detail-content" id="event-details">
        <article className="event-detail-article">
          <header className="event-detail-section-heading">
            <p className="eyebrow">Event information</p>
            <h2>행사 세부 안내</h2>
          </header>
          <div className="event-detail-description">
            {descriptionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>

          {event.agenda.length ? (
            <section className="event-agenda">
              <p className="eyebrow">Program</p>
              <h3>프로그램</h3>
              <div className="event-agenda-list">
                {event.agenda.map((item, index) => {
                  const [time, title] = item.split("|").map((value) => value.trim());
                  const hasTime = Boolean(title);

                  return (
                    <div className={hasTime ? "has-time" : undefined} key={item}>
                      <span>{hasTime ? time : String(index + 1).padStart(2, "0")}</span>
                      <strong>{title || time}</strong>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </article>

        <aside aria-label="행사 정보 및 신청" className="event-detail-sidebar">
          <div className="event-detail-sidebar-card">
            <p className="event-detail-sidebar-title">행사 정보</p>
            <div className="event-detail-sidebar-facts">
              <div className="event-detail-sidebar-organizer">
                <span className="event-detail-sidebar-organizer-avatar" data-protected-event-image>
                  {organizerLogo ? (
                    <Image alt="" height={38} src={organizerLogo} width={38} />
                  ) : (
                    <span aria-hidden>{organizerName}</span>
                  )}
                </span>
                <span>주최자</span>
                <strong>{organizerName}</strong>
              </div>
              <div>
                <CalendarDays aria-hidden size={19} />
                <span>일시</span>
                <strong>{event.dateLabel}</strong>
                <small><Clock3 aria-hidden size={14} />{event.time}</small>
              </div>
              <a
                aria-label={`${event.location} Google Maps에서 열기`}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.mapQuery ?? event.location)}`}
                rel="noreferrer"
                target="_blank"
              >
                <MapPin aria-hidden size={19} />
                <span>장소</span>
                <strong>{event.location}</strong>
                <small>Google Maps에서 보기 <ArrowUpRight aria-hidden size={14} /></small>
              </a>
              <div>
                <Users aria-hidden size={19} />
                <span>대상</span>
                <strong>{event.audience}</strong>
              </div>
            </div>

            {registrationTarget ? (
              <a className="event-apply-link" href={registrationTarget} rel="noreferrer" target="_blank">
                <span>참가 신청</span>
                <ArrowUpRight aria-hidden size={19} />
              </a>
            ) : (
              <span aria-disabled="true" className="event-apply-link is-disabled">
                <span>신청 링크 준비 중</span>
              </span>
            )}
            <small className="event-detail-apply-note">
              {registrationTarget ? "새 창에서 Google Form이 열립니다." : "관리자 페이지에 Google Form을 등록하면 버튼이 활성화됩니다."}
            </small>
          </div>
        </aside>
      </section>
    </main>
  );
}
