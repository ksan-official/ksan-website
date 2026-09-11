import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarDays, Clock3, MapPin, Ticket, Users } from "lucide-react";
import { ArchiveEventDetail } from "@/components/ArchiveEventDetail";
import { EventDetailGallery } from "@/components/EventDetailGallery";
import { getKsanEvent, isDefaultKsanGreeting, isDeletedEventRow, ksanEvents, parseEventMediaDescription, toKsanEventFromRow, type EventTableRow, type KsanEvent } from "@/lib/events";
import { createServerSupabaseClient, createServiceSupabaseClient, getSupabaseServerSecretKey, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const eventSelectWithMedia = "id,title,starts_at,location,description,registration_target,published,image_url,image_urls,sponsors,source_id";
const eventSelectFallback = "id,title,starts_at,location,description,registration_target,published";

function validExternalUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function defaultSourceId(row: EventTableRow) {
  return row.source_id ?? parseEventMediaDescription(row.description ?? "").sourceId;
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

async function getEvent(id: string): Promise<KsanEvent | null> {
  if (hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseServerSecretKey() ? createServiceSupabaseClient() : createServerSupabaseClient();
      const eventIdFilter = isUuid(id) ? `id.eq.${id},source_id.eq.${id}` : `source_id.eq.${id}`;
      let result: any = await supabase
        .from("events")
        .select(eventSelectWithMedia)
        .or(eventIdFilter)
        .maybeSingle();

      if (result.error && /(image_url|image_urls|sponsors)/i.test(result.error.message)) {
        result = isUuid(id)
          ? await supabase
              .from("events")
              .select(eventSelectFallback)
              .eq("id", id)
              .maybeSingle()
          : await supabase
              .from("events")
              .select(eventSelectFallback)
              .order("updated_at", { ascending: false })
              .limit(50);
      }

      const { data, error } = result;

      if (!isUuid(id) && Array.isArray(data)) {
        const rows = data as EventTableRow[];
        if (rows.some((row) => defaultSourceId(row) === id && (isDeletedEventRow(row) || row.published === false))) return null;
        return rows
          .filter((row) => row.published !== false)
          .map((row) => toKsanEventFromRow(row as EventTableRow))
          .find((event) => event.id === id) ?? getKsanEvent(id) ?? null;
      }

      if (!error && data) {
        const row = data as EventTableRow;
        if (isDeletedEventRow(row) || row.published === false) return null;
        return toKsanEventFromRow(row);
      }
    } catch (error) {
      console.error("Failed to load event from Supabase", error);
      return null;
    }
  }

  return getKsanEvent(id) ?? null;
}

export function generateStaticParams() {
  return ksanEvents.map((event) => ({ id: event.id }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  if (event.status === "past") {
    return <ArchiveEventDetail event={event} />;
  }

  const organizerLogo = event.organizerLogo;
  const registrationTarget = await getRegistrationTarget(event.title, event.registrationTarget);
  const descriptionParagraphs = event.description
    .split(/\r?\n\s*\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !isDefaultKsanGreeting(paragraph));
  const galleryImages = event.recapImages?.length ? event.recapImages : [event.image];

  return (
    <main className="event-detail-page" id="main">
      <section className="event-detail-profile">
        <EventDetailGallery images={galleryImages} title={event.title} />
        <div className="event-detail-intro">
          <h1>{event.title}</h1>
        </div>
      </section>

      <section className="event-detail-content" id="event-details">
        <article className="event-detail-article">
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

        <aside aria-label="정보 및 신청" className="event-detail-sidebar">
          <div className="event-detail-sidebar-card">
            <p className="event-detail-sidebar-title">정보</p>
            <div className="event-detail-sidebar-facts">
              <div className="event-detail-sidebar-organizer">
                <span className="event-detail-sidebar-organizer-avatar" data-protected-event-image>
                  {organizerLogo ? (
                    <Image alt="" height={38} src={organizerLogo} width={38} />
                  ) : (
                    <span aria-hidden>{event.organizerName ?? "KSAN"}</span>
                  )}
                </span>
                <span>주최자</span>
                <strong>{event.organizerName ?? "KSAN"}</strong>
              </div>
              <div>
                <CalendarDays aria-hidden size={19} />
                <span>일시</span>
                <strong>{event.dateLabel}</strong>
                <small><Clock3 aria-hidden size={14} />{event.time}</small>
              </div>
              {event.applicationDeadline ? (
                <div>
                  <CalendarDays aria-hidden size={19} />
                  <span>신청 마감</span>
                  <strong>{event.applicationDeadline}</strong>
                </div>
              ) : null}
              {event.price ? (
                <div>
                  <Ticket aria-hidden size={19} />
                  <span>가격</span>
                  <strong>{event.price}</strong>
                </div>
              ) : null}
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
          </div>
        </aside>
      </section>
    </main>
  );
}
