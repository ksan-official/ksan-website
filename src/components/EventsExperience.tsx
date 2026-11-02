"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ChevronDown,
  Search
} from "lucide-react";
import { getEventStatusLabel, type KsanEvent } from "@/lib/events";
import styles from "./EventsExperience.module.css";
import { FeatureHero } from "@/components/FeatureHero";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const citySearchAliases = [
  { matches: ["amsterdam"], terms: ["암스테르담", "암스텔담"] },
  { matches: ["rotterdam"], terms: ["로테르담"] },
  { matches: ["utrecht"], terms: ["위트레흐트"] },
  { matches: ["eindhoven"], terms: ["아인트호벤", "에인트호번"] },
  { matches: ["den haag", "the hague"], terms: ["덴하흐", "헤이그"] },
  { matches: ["groningen"], terms: ["흐로닝언", "그로닝겐"] },
  { matches: ["maastricht"], terms: ["마스트리흐트"] },
  { matches: ["leiden"], terms: ["레이던", "라이덴"] },
  { matches: ["delft"], terms: ["델프트"] },
  { matches: ["tilburg"], terms: ["틸뷔르흐", "틸버그"] },
  { matches: ["breda"], terms: ["브레다"] },
  { matches: ["nijmegen"], terms: ["네이메헌", "나이메헌"] },
  { matches: ["arnhem"], terms: ["아른험", "아른헴"] },
  { matches: ["haarlem"], terms: ["하를럼", "하를렘"] },
  { matches: ["amstelveen"], terms: ["암스텔베인"] },
  { matches: ["enschede"], terms: ["엔스헤데"] },
  { matches: ["wageningen"], terms: ["바헤닝언", "와게닝겐"] },
  { matches: ["netherlands", "nederland"], terms: ["네덜란드", "홀란드"] }
];

function getLocationSearchAliases(city: string, location: string) {
  const eventLocation = `${city} ${location}`.toLocaleLowerCase("en");

  return citySearchAliases.flatMap(({ matches, terms }) =>
    matches.some((name) => eventLocation.includes(name)) ? terms : []
  );
}

export function EventsExperience({ initialEvents = [] }: { initialEvents?: KsanEvent[] }) {
  const [query, setQuery] = useState("");
  const [keyword, setKeyword] = useState("all");
  const [events, setEvents] = useState<KsanEvent[]>(initialEvents);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true;

    fetch("/api/events")
      .then(async (response) => {
        const result = (await response.json()) as { events?: KsanEvent[] };
        return { ok: response.ok, result };
      })
      .then(({ ok, result }) => {
        if (!active || !ok) return;
        setEvents(result.events ?? []);
      })
      .catch(() => {
        if (active) setEvents((current) => current.length ? current : []);
      });

    return () => {
      active = false;
    };
  }, []);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.utils.toArray<HTMLElement>("[data-event-grid]").forEach((grid) => {
        gsap.from(grid.querySelectorAll("[data-event-post]"), {
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          scale: 0.96,
          scrollTrigger: { start: "top 84%", trigger: grid },
          stagger: 0.08,
          y: 46
        });
      });
    },
    { scope: pageRef }
  );

  const keywords = useMemo(
    () => Array.from(new Set(events.flatMap((event) => event.keywords))).sort(),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

    return events.filter((event) => {
      const searchable = [
        event.title,
        event.summary,
        event.city,
        event.location,
        ...getLocationSearchAliases(event.city, event.location),
        ...event.keywords
      ]
        .join(" ")
        .toLocaleLowerCase("ko-KR");
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesKeyword = keyword === "all" || event.keywords.includes(keyword);

      return matchesQuery && matchesKeyword;
    });
  }, [events, keyword, query]);

  const filteredUpcoming = filteredEvents.filter((event) => event.status === "upcoming");
  const filteredPast = filteredEvents.filter((event) => event.status === "past");
  const visibleUpcoming = showAllUpcoming ? filteredUpcoming : filteredUpcoming.slice(0, 6);
  const visiblePast = showAllPast ? filteredPast : filteredPast.slice(0, 6);

  return (
    <main className={`events-page ${styles.page}`} id="main" ref={pageRef}>
      <FeatureHero kind="events" eyebrow="행사" titleId="events-title" motion="events"
        title={<>다가오는 행사들을<br />확인해 보세요!</>}
        description="참여하고 싶은 행사를 찾아보고, 지난 행사의 즐거웠던 모습도 함께 둘러보세요!" />

      <section className="events-archive" aria-label="행사 목록">
        <form className="events-filter-bar" role="search" aria-label="행사 검색" onSubmit={(event) => { event.preventDefault(); setQuery(query.trim()); }}>
          <div className="events-filter-options">
            <label className="events-filter-option">
              <span>키워드</span>
              <select onChange={(event) => setKeyword(event.target.value)} value={keyword}>
                <option value="all">전체 키워드</option>
                {keywords.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <div className="events-search-field">
            <label className="sr-only" htmlFor="events-search">행사 검색</label>
            <div>
              <Search aria-hidden size={18} />
              <input
                id="events-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="행사명, 도시 또는 키워드 검색"
                type="search"
                value={query}
              />
              {query ? <button className={styles.clearSearch} onClick={() => setQuery("")} type="button">지우기</button> : null}
              <button className={styles.submitSearch} type="submit" aria-label="행사 검색"><ArrowRight aria-hidden size={18} /></button>
            </div>
          </div>
        </form>

        {(query || keyword !== "all") ? (
          <div className={styles.filterReset}>
            <button onClick={() => { setQuery(""); setKeyword("all"); }} type="button">필터 초기화</button>
          </div>
        ) : null}

        {filteredUpcoming.length > 0 ? (
          <section className="events-post-section events-upcoming-section">
            <div className="events-post-section-heading">
              <h3>진행 예정</h3>
              <span>{filteredUpcoming.length}</span>
            </div>
            <div className="events-post-grid" data-event-grid id="upcoming-events-grid">
              {visibleUpcoming.map((event) => (
                <Link className="event-post upcoming-event-post" data-event-post href={`/events/${event.id}`} key={event.id}>
                  <div className="event-post-image" data-protected-event-image style={{ backgroundImage: `url(${event.image})` }}>
                    <span>{event.dateLabel}</span>
                    <small className="event-post-status-badge">{getEventStatusLabel(event.status)}</small>
                    <div aria-label={`주최 ${event.organizerName ?? "KSAN"}`} className="event-post-organizer">
                      {event.organizerLogo ? (
                        <Image alt="" height={48} src={event.organizerLogo} width={48} />
                      ) : (
                        <span aria-hidden>{event.organizerName ?? "KSAN"}</span>
                      )}
                    </div>
                  </div>
                  <div className="event-post-copy">
                    <p>{event.keywords.join(" · ")}</p>
                    <h4>{event.title}</h4>
                    <div><span>{event.city}</span><ArrowRight aria-hidden size={18} /></div>
                  </div>
                </Link>
              ))}
            </div>
            {filteredUpcoming.length > 6 ? (
              <div className="events-expand-row">
                <button
                  aria-controls="upcoming-events-grid"
                  aria-expanded={showAllUpcoming}
                  onClick={() => setShowAllUpcoming((current) => !current)}
                  type="button"
                >
                  {showAllUpcoming ? "진행 예정 접기" : `진행 예정 ${filteredUpcoming.length - 6}개 더 보기`}
                  <ChevronDown aria-hidden className={showAllUpcoming ? "is-open" : ""} size={18} />
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {filteredPast.length > 0 ? (
          <section className="events-post-section events-history-section" id="event-archive">
            <div className="events-post-section-heading">
              <h3>KSAN의 지난 행사</h3>
              <span>{filteredPast.length}</span>
            </div>
            <div className="events-post-grid" data-event-grid id="past-events-grid">
              {visiblePast.map((event) => (
                <Link className="event-post past-event-post" data-event-post href={`/events/${event.id}`} key={event.id}>
                  <div className="event-post-image" data-protected-event-image style={{ backgroundImage: `url(${event.image})` }}>
                    <span>{event.dateLabel}</span>
                    <small className="event-post-status-badge">{getEventStatusLabel(event.status)}</small>
                  </div>
                  <div className="event-post-copy">
                    <p>{event.keywords.join(" · ")}</p>
                    <h4>{event.title}</h4>
                    <div><span>{event.city}</span><ArrowRight aria-hidden size={18} /></div>
                  </div>
                </Link>
              ))}
            </div>
            {filteredPast.length > 6 ? (
              <div className="events-expand-row">
                <button
                  aria-controls="past-events-grid"
                  aria-expanded={showAllPast}
                  onClick={() => setShowAllPast((current) => !current)}
                  type="button"
                >
                  {showAllPast ? "지난 행사 접기" : `지난 행사 ${filteredPast.length - 6}개 더 보기`}
                  <ChevronDown aria-hidden className={showAllPast ? "is-open" : ""} size={18} />
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {filteredEvents.length === 0 ? (
          <div className="events-empty-state">
            <strong>조건에 맞는 행사가 없습니다.</strong>
            <p>검색어나 키워드를 바꿔 다시 검색해 보세요.</p>
          </div>
        ) : null}
      </section>

    </main>
  );
}
