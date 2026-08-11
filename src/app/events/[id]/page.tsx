import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { getKsanEvent, upcomingEvents } from "@/lib/events";

export function generateStaticParams() {
  return upcomingEvents.map((event) => ({ id: event.id }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getKsanEvent(id);

  if (!event || event.status !== "upcoming") {
    notFound();
  }

  return (
    <main className="event-detail-page" id="main">
      <Link className="event-detail-back" href="/events"><ArrowLeft aria-hidden size={18} />행사 목록</Link>
      <section className="event-detail-hero">
        <div className="event-detail-image" style={{ backgroundImage: `url(${event.image})` }} />
        <div className="event-detail-copy">
          <p className="eyebrow">{event.keywords.join(" · ")}</p>
          <h1>{event.title}</h1>
          <p>{event.summary}</p>
        </div>
      </section>

      <section className="event-detail-content">
        <article>
          <p className="eyebrow">행사 소개</p>
          <h2>새로운 정보가 사람을 만나, 다음 기회가 되는 자리</h2>
          <p className="event-detail-description">{event.description}</p>
          <div className="event-agenda">
            <h3>프로그램</h3>
            {event.agenda.map((item, index) => (
              <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>
            ))}
          </div>
        </article>

        <aside className="event-detail-panel">
          <div><CalendarDays aria-hidden size={21} /><span>일시</span><strong>{event.dateLabel}<br />{event.time}</strong></div>
          <div><MapPin aria-hidden size={21} /><span>장소</span><strong>{event.location}</strong></div>
          <div><Users aria-hidden size={21} /><span>대상</span><strong>{event.audience}</strong></div>
          <Link className="event-apply-link" href={`/events/${event.id}/apply`}>참여 신청하기 <ArrowRight aria-hidden size={19} /></Link>
        </aside>
      </section>
    </main>
  );
}
