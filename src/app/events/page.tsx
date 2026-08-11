import Link from "next/link";
import { fallbackEvents } from "@/lib/content";

export default function EventsPage() {
  return (
    <main className="page" id="main">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Events</p>
          <h1 className="page-title">행사 소개와 신청 기록을 한 흐름으로</h1>
          <p className="lead">
            오리엔테이션, 네트워킹, 세미나, 커뮤니티 모임까지 KSAN에서 열리는 자리를 확인하고
            신청할 수 있습니다.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/events/event-1/apply">
              행사 신청 예시
            </Link>
            <Link className="button secondary" href="/mypage">
              신청 내역 보기
            </Link>
          </div>
        </div>
        <aside className="ops-board">
          <div className="flow-step">
            <strong>다가오는 행사</strong>
            <span className="muted">신입생, 재학생, 졸업생이 만나는 자리</span>
          </div>
          <div className="flow-step">
            <strong>참여 신청</strong>
            <span className="muted">행사별 신청 페이지 또는 외부 신청 링크</span>
          </div>
          <div className="flow-step">
            <strong>내 기록</strong>
            <span className="muted">신청한 행사는 마이페이지에서 확인</span>
          </div>
        </aside>
      </section>
      <div className="grid">
        {fallbackEvents.map((event) => (
          <article className="card" key={event.id}>
            <p className="muted">{event.startsAt} · {event.location}</p>
            <h2>{event.title}</h2>
            <p className="muted">{event.description}</p>
            <div className="button-row">
              <Link className="button" href={`/events/${event.id}/apply`}>
                신청하기
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
