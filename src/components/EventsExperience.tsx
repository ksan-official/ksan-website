"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Images,
  MapPin,
  Search,
  X
} from "lucide-react";
import { ksanEvents, upcomingEvents, type KsanEvent } from "@/lib/events";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function EventsExperience() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [keyword, setKeyword] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedRecap, setSelectedRecap] = useState<KsanEvent | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const galleryCloseRef = useRef<HTMLButtonElement>(null);
  const galleryTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % upcomingEvents.length);
    }, 5600);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (!selectedRecap) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const imageCount = selectedRecap.recapImages?.length ?? 0;

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      galleryCloseRef.current?.focus();
      gsap.fromTo(".event-gallery-backdrop", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(
        ".event-gallery-dialog",
        { autoAlpha: 0, scale: 0.94, y: 34 },
        { autoAlpha: 1, duration: 0.55, ease: "power3.out", scale: 1, y: 0 }
      );
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedRecap(null);
      }
      if (event.key === "ArrowLeft" && imageCount > 1) {
        setActivePhoto((current) => (current - 1 + imageCount) % imageCount);
      }
      if (event.key === "ArrowRight" && imageCount > 1) {
        setActivePhoto((current) => (current + 1) % imageCount);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      galleryTriggerRef.current?.focus();
    };
  }, [selectedRecap]);

  useEffect(() => {
    if (!selectedRecap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.fromTo(
      ".event-gallery-main-image",
      { autoAlpha: 0.48, scale: 1.025 },
      { autoAlpha: 1, duration: 0.55, ease: "power2.out", scale: 1 }
    );
  }, [activePhoto, selectedRecap]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.from("[data-events-intro] > *", {
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.1,
        y: 28
      });

      gsap.from("[data-event-post]", {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        scale: 0.96,
        scrollTrigger: { start: "top 84%", trigger: "[data-event-grid]" },
        stagger: 0.08,
        y: 46
      });
    },
    { scope: pageRef }
  );

  const keywords = useMemo(
    () => Array.from(new Set(ksanEvents.flatMap((event) => event.keywords))).sort(),
    []
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

    return ksanEvents.filter((event) => {
      const searchable = [event.title, event.summary, event.location, ...event.keywords]
        .join(" ")
        .toLocaleLowerCase("ko-KR");
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesKeyword = keyword === "all" || event.keywords.includes(keyword);
      const matchesFrom = !dateFrom || event.date >= dateFrom;
      const matchesTo = !dateTo || event.date <= dateTo;

      return matchesQuery && matchesKeyword && matchesFrom && matchesTo;
    });
  }, [dateFrom, dateTo, keyword, query]);

  const filteredUpcoming = filteredEvents.filter((event) => event.status === "upcoming");
  const filteredPast = filteredEvents.filter((event) => event.status === "past");

  function showPrevious() {
    setActiveSlide((current) => (current - 1 + upcomingEvents.length) % upcomingEvents.length);
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % upcomingEvents.length);
  }

  function finishSwipe(clientX: number) {
    if (pointerStart.current === null) {
      return;
    }

    const distance = clientX - pointerStart.current;
    if (Math.abs(distance) > 55) {
      distance > 0 ? showPrevious() : showNext();
    }
    pointerStart.current = null;
  }

  function openRecap(event: KsanEvent, trigger: HTMLButtonElement) {
    galleryTriggerRef.current = trigger;
    setActivePhoto(0);
    setSelectedRecap(event);
  }

  function showPreviousPhoto() {
    const imageCount = selectedRecap?.recapImages?.length ?? 0;
    if (imageCount > 1) {
      setActivePhoto((current) => (current - 1 + imageCount) % imageCount);
    }
  }

  function showNextPhoto() {
    const imageCount = selectedRecap?.recapImages?.length ?? 0;
    if (imageCount > 1) {
      setActivePhoto((current) => (current + 1) % imageCount);
    }
  }

  return (
    <main className="events-page" id="main" ref={pageRef}>
      <section
        aria-label="다가오는 행사"
        aria-roledescription="carousel"
        className="events-carousel"
        onBlur={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => finishSwipe(event.clientX)}
      >
        <div
          className="events-carousel-track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {upcomingEvents.map((event, index) => (
            <article
              aria-hidden={index !== activeSlide}
              className="events-hero-slide"
              key={event.id}
              style={{ backgroundImage: `url(${event.image})` }}
            >
              <div className="events-hero-content" data-events-intro={index === 0 ? "" : undefined}>
                <p className="events-hero-kicker">다가오는 행사 · {event.keywords.join(" / ")}</p>
                <h1>{event.title}</h1>
                <p className="events-hero-summary">{event.summary}</p>
                <div className="events-hero-meta">
                  <span><CalendarDays aria-hidden size={18} />{event.dateLabel} · {event.time}</span>
                  <span><MapPin aria-hidden size={18} />{event.location}</span>
                </div>
                <Link className="events-hero-link" href={`/events/${event.id}`} tabIndex={index === activeSlide ? 0 : -1}>
                  행사 자세히 보기 <ArrowRight aria-hidden size={19} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="events-carousel-controls">
          <div className="events-carousel-dots" role="tablist" aria-label="행사 배너 선택">
            {upcomingEvents.map((event, index) => (
              <button
                aria-label={`${event.title} 배너 보기`}
                aria-selected={index === activeSlide}
                className={index === activeSlide ? "is-active" : ""}
                key={event.id}
                onClick={() => setActiveSlide(index)}
                role="tab"
                type="button"
              />
            ))}
          </div>
          <div className="events-carousel-arrows">
            <button aria-label="이전 행사" onClick={showPrevious} type="button"><ChevronLeft aria-hidden /></button>
            <button aria-label="다음 행사" onClick={showNext} type="button"><ChevronRight aria-hidden /></button>
          </div>
        </div>
      </section>

      <section className="events-archive">
        <header className="events-archive-heading">
          <div>
            <p className="eyebrow">KSAN Events</p>
            <h2>다가올 만남과, 우리가 함께한 장면들.</h2>
          </div>
          <p>참여할 행사를 찾거나 지난 현장의 기록을 천천히 둘러보세요.</p>
        </header>

        <div className="events-filter-bar">
          <label className="events-search-field">
            <span>행사 검색</span>
            <div><Search aria-hidden size={19} /><input onChange={(event) => setQuery(event.target.value)} placeholder="행사명 또는 도시 검색" value={query} /></div>
          </label>
          <label>
            <span>키워드</span>
            <select onChange={(event) => setKeyword(event.target.value)} value={keyword}>
              <option value="all">전체 키워드</option>
              {keywords.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>시작일</span>
            <input onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
          </label>
          <label>
            <span>종료일</span>
            <input min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} />
          </label>
        </div>

        <div className="events-result-line">
          <strong>{filteredEvents.length}개의 행사</strong>
          {(query || keyword !== "all" || dateFrom || dateTo) ? (
            <button onClick={() => { setQuery(""); setKeyword("all"); setDateFrom(""); setDateTo(""); }} type="button">필터 초기화</button>
          ) : null}
        </div>

        {filteredUpcoming.length > 0 ? (
          <section className="events-post-section">
            <div className="events-post-section-heading">
              <h3>진행 예정</h3>
              <span>{filteredUpcoming.length}</span>
            </div>
            <div className="events-post-grid" data-event-grid>
              {filteredUpcoming.map((event) => (
                <Link className="event-post upcoming-event-post" data-event-post href={`/events/${event.id}`} key={event.id}>
                  <div className="event-post-image" style={{ backgroundImage: `url(${event.image})` }}>
                    <span>{event.dateLabel}</span>
                  </div>
                  <div className="event-post-copy">
                    <p>{event.keywords.join(" · ")}</p>
                    <h4>{event.title}</h4>
                    <div><span>{event.location}</span><ArrowRight aria-hidden size={18} /></div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {filteredPast.length > 0 ? (
          <section className="events-post-section events-recap-section">
            <div className="events-post-section-heading">
              <div>
                <h3>지난 행사 기록</h3>
                <p>한 장의 포스터 대신, 그날의 분위기가 남아 있는 현장 사진으로 기록합니다.</p>
              </div>
              <span>{filteredPast.length}</span>
            </div>
            <div className="events-post-grid">
              {filteredPast.map((event) => (
                <button
                  aria-label={`${event.title} 현장 사진 보기`}
                  className="event-post recap-event-post"
                  data-event-post
                  key={event.id}
                  onClick={(clickEvent) => openRecap(event, clickEvent.currentTarget)}
                  type="button"
                >
                  <div className="event-recap-collage">
                    {(event.recapImages ?? [event.image]).map((image, index) => (
                      <div key={image} style={{ backgroundImage: `url(${image})` }} className={`recap-image recap-image-${index + 1}`} />
                    ))}
                    <span className="event-photo-count"><Images aria-hidden size={16} />{event.photoCount} Photos</span>
                  </div>
                  <div className="event-post-copy">
                    <p>Event Recap · {event.keywords.join(" · ")}</p>
                    <h4>{event.title}</h4>
                    <div>
                      <span>{event.dateLabel} · {event.location}</span>
                      <span className="event-recap-action">현장 사진 보기 <ArrowRight aria-hidden size={17} /></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {filteredEvents.length === 0 ? (
          <div className="events-empty-state">
            <strong>조건에 맞는 행사가 없습니다.</strong>
            <p>키워드나 날짜 범위를 조금 넓혀 다시 검색해 보세요.</p>
          </div>
        ) : null}
      </section>

      {selectedRecap ? (
        <div
          className="event-gallery-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setSelectedRecap(null);
            }
          }}
        >
          <section
            aria-labelledby="event-gallery-title"
            aria-modal="true"
            className="event-gallery-dialog"
            role="dialog"
          >
            <header className="event-gallery-header">
              <div>
                <p>{selectedRecap.dateLabel} · {selectedRecap.location}</p>
                <h2 id="event-gallery-title">{selectedRecap.title}</h2>
              </div>
              <button aria-label="사진 갤러리 닫기" autoFocus onClick={() => setSelectedRecap(null)} ref={galleryCloseRef} type="button">
                <X aria-hidden />
              </button>
            </header>

            <div className="event-gallery-stage">
              <div
                aria-label={`${selectedRecap.title} 현장 사진 ${activePhoto + 1}`}
                className="event-gallery-main-image"
                role="img"
                style={{ backgroundImage: `url(${selectedRecap.recapImages?.[activePhoto] ?? selectedRecap.image})` }}
              />
              <button aria-label="이전 사진" className="event-gallery-previous" onClick={showPreviousPhoto} type="button">
                <ChevronLeft aria-hidden />
              </button>
              <button aria-label="다음 사진" className="event-gallery-next" onClick={showNextPhoto} type="button">
                <ChevronRight aria-hidden />
              </button>
              <span className="event-gallery-counter">
                {String(activePhoto + 1).padStart(2, "0")} / {String(selectedRecap.recapImages?.length ?? 1).padStart(2, "0")}
              </span>
            </div>

            <div className="event-gallery-footer">
              <p>대표 사진 {selectedRecap.recapImages?.length ?? 1}장 · 전체 기록 {selectedRecap.photoCount}장</p>
              <div className="event-gallery-thumbnails" aria-label="사진 썸네일">
                {(selectedRecap.recapImages ?? [selectedRecap.image]).map((image, index) => (
                  <button
                    aria-label={`${index + 1}번째 사진 보기`}
                    aria-pressed={index === activePhoto}
                    className={index === activePhoto ? "is-active" : ""}
                    key={image}
                    onClick={() => setActivePhoto(index)}
                    style={{ backgroundImage: `url(${image})` }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
