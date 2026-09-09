"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeft, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, MapPin, X } from "lucide-react";
import type { KsanEvent } from "@/lib/events";

export function ArchiveEventDetail({ event }: { event: KsanEvent }) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const images = useMemo(
    () => event.recapImages?.length ? event.recapImages : [event.image],
    [event.image, event.recapImages]
  );
  const organizerName = event.organizerName ?? "KSAN";
  const organizerLogo = event.organizerLogo ?? "/images/ksan-logo-black.png";
  const sponsors = event.sponsors ?? [];
  const descriptionPreview = event.description.replace(/\s+/g, " ").trim();

  useGSAP(
    () => {
      if (!marqueeRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const marquee = gsap.to(marqueeRef.current, {
        duration: 26,
        ease: "none",
        repeat: -1,
        xPercent: -50
      });

      return () => marquee.kill();
    },
    { scope: pageRef }
  );

  useEffect(() => {
    if (activePhoto === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") setActivePhoto(null);
      if (keyEvent.key === "ArrowLeft") {
        setActivePhoto((current) => current === null ? null : (current - 1 + images.length) % images.length);
      }
      if (keyEvent.key === "ArrowRight") {
        setActivePhoto((current) => current === null ? null : (current + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePhoto, images.length]);

  useEffect(() => {
    if (activePhoto === null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(".archive-lightbox-image", { autoAlpha: 0.45, scale: 1.025 }, { autoAlpha: 1, duration: 0.45, scale: 1 });
  }, [activePhoto]);

  function showPrevious() {
    setActivePhoto((current) => current === null ? 0 : (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setActivePhoto((current) => current === null ? 0 : (current + 1) % images.length);
  }

  return (
    <main className="archive-detail-page" id="main" ref={pageRef}>
      <Link className="event-detail-back" href="/events#event-archive"><ArrowLeft aria-hidden size={18} />지난 행사</Link>

      <section className="archive-detail-hero">
        <div className="archive-photo-grid" aria-label={`${event.title} 현장 사진`}>
          {images.slice(0, 3).map((image, index) => (
            <button
              aria-label={`${index + 1}번째 현장 사진 크게 보기`}
              className="archive-photo-tile"
              data-protected-event-image
              key={image}
              onClick={() => setActivePhoto(index)}
              style={{ backgroundImage: `url(${image})` }}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
          <span className="archive-photo-total">대표 사진 {images.length}장 · 전체 {event.photoCount ?? images.length}장</span>
        </div>

        <aside className="archive-detail-summary">
          <p className="eyebrow">Event archive</p>
          <h1>{event.title}</h1>
          <p className="archive-detail-lead">{event.summary}</p>

          <div className="archive-detail-meta">
            <div className="archive-detail-organizer">
              <span className="archive-detail-organizer-logo" data-protected-event-image>
                <Image alt={`${organizerName} 로고`} height={64} src={organizerLogo} width={64} />
              </span>
              <span><small>주최</small><strong>{organizerName}</strong></span>
            </div>
            <div>
              <CalendarDays aria-hidden size={21} />
              <span><small>날짜</small><strong>{event.dateLabel}</strong></span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
              rel="noreferrer"
              target="_blank"
            >
              <MapPin aria-hidden size={21} />
              <span><small>장소</small><strong>{event.location}</strong></span>
              <ExternalLink aria-hidden className="archive-meta-action" size={15} />
            </a>
          </div>

          <details className="archive-summary-description">
            <summary>
              <span className="archive-description-preview">{descriptionPreview}</span>
              <span className="archive-description-toggle">
                <span className="archive-description-open-label">더 읽기</span>
                <span className="archive-description-close-label">접기</span>
                <ChevronDown aria-hidden size={18} />
              </span>
            </summary>
            <p>{event.description}</p>
          </details>

          {sponsors.length ? (
            <section className="archive-summary-sponsors" aria-labelledby="archive-summary-sponsors-title">
              <header>
                <small>With our partners</small>
                <h2 id="archive-summary-sponsors-title">함께한 후원사</h2>
              </header>
              <div className="archive-sponsor-marquee">
                <div className="archive-sponsor-track" ref={marqueeRef}>
                  {[0, 1].map((group) => (
                    <div aria-hidden={group === 1} className="archive-sponsor-group" key={group}>
                      {sponsors.map((sponsor) => (
                        <div className={`archive-sponsor-logo${sponsor.image ? "" : " archive-sponsor-wordmark"}`} data-protected-event-image key={`${group}-${sponsor.name}`}>
                          {sponsor.image ? (
                            <Image alt={group === 0 ? sponsor.name : ""} height={72} src={sponsor.image} width={210} />
                          ) : (
                            <span aria-hidden={group === 1}>{sponsor.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <Link className="archive-summary-back" href="/events#event-archive">다른 지난 행사 보기 <ChevronRight aria-hidden size={17} /></Link>
        </aside>
      </section>

      {activePhoto !== null ? (
        <div
          className="archive-lightbox"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.currentTarget === mouseEvent.target) setActivePhoto(null);
          }}
        >
          <section aria-label={`${event.title} 사진 갤러리`} aria-modal="true" role="dialog">
            <button aria-label="사진 갤러리 닫기" className="archive-lightbox-close" onClick={() => setActivePhoto(null)} ref={closeRef} type="button">
              <X aria-hidden />
            </button>
            <div
              aria-label={`${event.title} 현장 사진 ${activePhoto + 1}`}
              className="archive-lightbox-image"
              data-protected-event-image
              role="img"
              style={{ backgroundImage: `url(${images[activePhoto]})` }}
            />
            {images.length > 1 ? (
              <>
                <button aria-label="이전 사진" className="archive-lightbox-previous" onClick={showPrevious} type="button"><ChevronLeft aria-hidden /></button>
                <button aria-label="다음 사진" className="archive-lightbox-next" onClick={showNext} type="button"><ChevronRight aria-hidden /></button>
              </>
            ) : null}
            <span className="archive-lightbox-count">{activePhoto + 1} / {images.length}</span>
          </section>
        </div>
      ) : null}
    </main>
  );
}
