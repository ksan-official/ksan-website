"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type EventSnapshot = { alt: string; src: string; title: string };

export function HomeEventGallery({ snapshots }: { snapshots: EventSnapshot[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || paused || snapshots.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearInterval(timer);
      if (entry.isIntersecting) {
        timer = setInterval(() => setActiveIndex((index) => (index + 1) % snapshots.length), 4500);
      }
    }, { threshold: 0.4 });
    observer.observe(gallery);

    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [paused, snapshots.length]);

  return (
    <div
      className="home-event-accordion"
      ref={galleryRef}
      role="group"
      aria-label="KSAN 행사 사진. 사진을 선택하면 크게 볼 수 있습니다."
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const next = (activeIndex + (event.key === "ArrowRight" ? 1 : -1) + snapshots.length) % snapshots.length;
        setActiveIndex(next);
        galleryRef.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
      }}
    >
      {snapshots.map((snapshot, index) => (
        <button
          aria-label={snapshot.title}
          aria-pressed={activeIndex === index}
          className={`home-event-panel${activeIndex === index ? " is-active" : ""}`}
          key={snapshot.src}
          onClick={() => {
            setActiveIndex(index);
            setPaused(true);
          }}
          onFocus={() => setActiveIndex(index)}
          onMouseEnter={() => setActiveIndex(index)}
          type="button"
        >
          <Image alt={snapshot.alt} className="home-event-panel-image" fill sizes="(max-width: 600px) 90vw, 65vw" src={snapshot.src} />
          <span aria-hidden="true" className="home-event-panel-shade" />
          <span className="home-event-panel-caption" aria-hidden="true">{snapshot.title}</span>
        </button>
      ))}
    </div>
  );
}
