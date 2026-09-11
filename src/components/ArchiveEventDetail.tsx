"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, MapPin, X } from "lucide-react";
import { isDefaultKsanGreeting, type KsanEvent } from "@/lib/events";

export function ArchiveEventDetail({ event }: { event: KsanEvent }) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const pageRef = useRef<HTMLElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const images = useMemo(
    () => event.recapImages?.length ? event.recapImages : [event.image],
    [event.image, event.recapImages]
  );
  const organizerName = event.organizerName ?? "KSAN";
  const sponsors = event.sponsors ?? [];
  const shouldAnimateSponsors = sponsors.length > 3;
  const descriptionParagraphs = event.description
    .split(/\r?\n\s*\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !isDefaultKsanGreeting(paragraph));

  useGSAP(
    () => {
      if (!shouldAnimateSponsors || !marqueeRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const marquee = gsap.to(marqueeRef.current, {
        duration: 26,
        ease: "none",
        repeat: -1,
        xPercent: -50
      });

      return () => marquee.kill();
    },
    { dependencies: [shouldAnimateSponsors], scope: pageRef }
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
        <div className="archive-photo-gallery" aria-label={`${event.title} 현장 사진`}>
          <button
            aria-label={`${event.title} 대표 사진 크게 보기`}
            className="archive-photo-main"
            data-protected-event-image
            onClick={() => setActivePhoto(selectedPhoto)}
            type="button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={`${event.title} 대표 사진`} src={images[selectedPhoto] ?? images[0]} />
            {images.length > 1 ? (
              <span className="archive-photo-total">{selectedPhoto + 1} / {event.photoCount ?? images.length}</span>
            ) : null}
          </button>
          {images.length > 1 ? (
            <div className="archive-photo-thumbnails">
              {images.map((image, index) => (
                <button
                  aria-label={`${index + 1}번째 현장 사진 보기`}
                  aria-pressed={selectedPhoto === index}
                  className={selectedPhoto === index ? "is-active" : undefined}
                  key={`${image}-${index}`}
                  onClick={() => setSelectedPhoto(index)}
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={image} />
                </button>
              ))}
            </div>
          ) : null}
          <section className="archive-photo-story">
            <div>
              {descriptionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        </div>

        <aside className="archive-detail-summary">
          <h1>{event.title}</h1>

          <div className="archive-detail-meta">
            <div className="archive-detail-organizer">
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

          {sponsors.length ? (
            <section className="archive-summary-sponsors" aria-labelledby="archive-summary-sponsors-title">
              <header>
                <small>With our partners</small>
                <h2 id="archive-summary-sponsors-title">함께한 후원사</h2>
              </header>
              {shouldAnimateSponsors ? (
                <div className="archive-sponsor-marquee">
                  <div className="archive-sponsor-track" ref={marqueeRef}>
                    {[0, 1].map((group) => (
                      <div aria-hidden={group === 1} className="archive-sponsor-group" key={group}>
                        {sponsors.map((sponsor) => (
                          <div className={`archive-sponsor-logo${sponsor.image ? "" : " archive-sponsor-wordmark"}`} data-protected-event-image key={`${group}-${sponsor.name}`}>
                            {sponsor.image ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt={group === 0 ? sponsor.name : ""} src={sponsor.image} />
                              </>
                            ) : (
                              <span aria-hidden={group === 1}>{sponsor.name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="archive-sponsor-static">
                  {sponsors.map((sponsor) => (
                    <div className={`archive-sponsor-logo${sponsor.image ? "" : " archive-sponsor-wordmark"}`} data-protected-event-image key={sponsor.name}>
                      {sponsor.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={sponsor.name} src={sponsor.image} />
                        </>
                      ) : (
                        <span>{sponsor.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
