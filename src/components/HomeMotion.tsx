"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeMotion() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>("[data-home-page]");
    const shell = page?.closest<HTMLElement>(".shell");
    const hero = page?.querySelector<HTMLElement>(".hero-panel");
    const header = shell?.querySelector<HTMLElement>(".site-header");
    if (!shell || !hero || !header) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const height = Math.ceil(header.getBoundingClientRect().height);
      shell.style.setProperty("--home-overlay-header-height", `${height}px`);
      shell.classList.toggle("home-hero-passed", hero.getBoundingClientRect().bottom <= height + 1);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(header);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      shell.classList.remove("home-hero-passed");
      shell.style.removeProperty("--home-overlay-header-height");
    };
  }, []);

  useGSAP(() => {
    const page = document.querySelector<HTMLElement>("[data-home-page]");

    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const headerHeight = () => Math.ceil(document.querySelector<HTMLElement>(".site-header")?.getBoundingClientRect().height ?? 80);
    const measureChapters = () => page.style.setProperty("--home-header-height", `${headerHeight()}px`);
    page.classList.add("has-chapter-motion");
    measureChapters();
    ScrollTrigger.addEventListener("refreshInit", measureChapters);

    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .from("[data-hero-copy] > *", {
          autoAlpha: 0,
          duration: 0.85,
          stagger: 0.1,
          y: 30
        });

      const scrubCopy = page.querySelector("[data-scrub-copy]");
      if (scrubCopy) gsap.fromTo(
        scrubCopy,
        { opacity: 0.42 },
        {
          ease: "none",
          opacity: 1,
          scrollTrigger: {
            end: "bottom 38%",
            scrub: 0.6,
            start: "top 74%",
            trigger: scrubCopy
          }
        }
      );

      const services = page.querySelector<HTMLElement>("[data-services-section]");
      const viewport = page.querySelector<HTMLElement>("[data-services-viewport]");
      const track = page.querySelector<HTMLElement>("[data-services-track]");
      const progress = page.querySelector<HTMLElement>("[data-services-progress]");

      if (services && viewport && track && progress) {
        const media = gsap.matchMedia();
        media.add("(min-height: 700px)", () => {
          const header = document.querySelector<HTMLElement>(".site-header");
          const headerHeight = () => Math.ceil(header?.getBoundingClientRect().height ?? 80);
          const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
          const measure = () => services.style.setProperty("--services-header-height", `${headerHeight()}px`);
          measure();
          services.classList.add("is-scroll-driven");
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: services,
              start: () => `top ${headerHeight()}`,
              end: () => `+=${distance() + 180}`,
              pin: true,
              scrub: 0.65,
              anticipatePin: 1,
              id: "home-services-scroll",
              refreshPriority: 90,
              invalidateOnRefresh: true,
              onRefreshInit: measure
            }
          });
          timeline.to(track, { x: () => -distance(), ease: "none", duration: 1 }, 0);
          timeline.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);

          const revealFocusedCard = (event: FocusEvent) => {
            const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".home-section-block") : null;
            const trigger = timeline.scrollTrigger;
            if (!card || !trigger || distance() === 0) return;
            const bounds = card.getBoundingClientRect();
            if (bounds.left >= 0 && bounds.right <= viewport.clientWidth) return;
            const target = Math.min(distance(), Math.max(0, card.offsetLeft - 24));
            trigger.scroll(trigger.start + (target / distance()) * (trigger.end - trigger.start));
          };
          track.addEventListener("focusin", revealFocusedCard);
          return () => {
            track.removeEventListener("focusin", revealFocusedCard);
            services.classList.remove("is-scroll-driven");
            services.style.removeProperty("--services-header-height");
          };
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-motion-section]").forEach((section) => {
        const title = section.querySelector("h2");
        const cards = section.querySelectorAll<HTMLElement>("[data-motion-card]");

        if (title) {
          gsap.from(title, {
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { start: "top 88%", trigger: title },
            y: 28
          });
        }

        if (cards.length) {
          gsap.from(cards, {
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            scale: 0.96,
            stagger: 0.1,
            scrollTrigger: { start: "top 86%", trigger: cards[0] },
            y: 42
          });
        }
      });

      const networkSection = page.querySelector<HTMLElement>(".home-network-section");
      const networkPhoto = page.querySelector<HTMLElement>("[data-network-photo]");

      if (networkSection && networkPhoto) {
        gsap.fromTo(
          networkPhoto,
          { scale: 1.06 },
          {
            ease: "none",
            scale: 1,
            scrollTrigger: {
              end: "center 52%",
              scrub: 0.7,
              start: "top 92%",
              trigger: networkSection
            }
          }
        );

      }

      const chapterMedia = gsap.matchMedia();
      chapterMedia.add("(min-width: 901px) and (min-height: 700px)", () => {
        const sections = Array.from(page.querySelectorAll<HTMLElement>(":scope > section"));
        sections.forEach((section, index) => {
          if (section === services || section.classList.contains("home-contact-section")) return;
          const isHero = section.classList.contains("hero-panel");
          const availableHeight = window.innerHeight - (isHero ? 0 : headerHeight());
          if (section.offsetHeight > availableHeight + 8) return;
          ScrollTrigger.create({
            trigger: section,
            start: () => `top ${isHero ? 0 : headerHeight()}`,
            end: () => `+=${Math.round(window.innerHeight * 0.22)}`,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 100 - index * 10,
            id: `home-chapter-${index}`
          });
        });
      });

      const chapterSections = Array.from(page.querySelectorAll<HTMLElement>("section"))
        .filter((section) => section.parentElement === page || section.parentElement?.classList.contains("pin-spacer"));
      const footer = document.querySelector<HTMLElement>(".site-footer");
      if (footer) chapterSections.push(footer);
      const chapterMarkers = chapterSections.map((section) => ScrollTrigger.create({
        trigger: section,
        start: () => `top ${section.classList.contains("hero-panel") ? 0 : headerHeight()}`,
        end: () => `bottom bottom`,
        refreshPriority: -10
      }));

      ScrollTrigger.create({
        start: 0,
        end: "max",
        refreshPriority: -20,
        snap: {
          delay: 0.18,
          duration: { min: 0.4, max: 0.75 },
          ease: "power2.inOut",
          inertia: false,
          snapTo: (value, trigger) => {
            if (!trigger) return value;
            const maximum = trigger.end - trigger.start;
            if (!maximum) return value;
            const scroll = trigger.scroll();
            const servicesTrigger = ScrollTrigger.getById("home-services-scroll");
            const stops = [0, maximum];
            chapterMarkers.forEach((marker, index) => {
              const section = chapterSections[index];
              const chapterPin = ScrollTrigger.getAll().find((item) => item.pin === section);
              stops.push(chapterPin?.start ?? marker.start);
              if (chapterPin) stops.push(chapterPin.end);
            });
            if (servicesTrigger && track) {
              const cards = Array.from(track.querySelectorAll<HTMLElement>(".home-section-block"));
              const distance = Math.max(0, track.scrollWidth - (viewport?.clientWidth ?? 0));
              cards.forEach((card) => {
                const fraction = distance ? Math.min(1, Math.max(0, card.offsetLeft - cards[0].offsetLeft) / distance) : 0;
                stops.push(servicesTrigger.start + fraction * (servicesTrigger.end - servicesTrigger.start));
              });
            }
            const readingLongSection = chapterMarkers.some((marker, index) => {
              const section = chapterSections[index];
              return section !== services && section.offsetHeight > window.innerHeight - headerHeight() + 8
                && scroll > marker.start + 80 && scroll < marker.end - 80;
            });
            if (readingLongSection) return value;
            const normalizedStops = [...new Set(stops.map((stop) => gsap.utils.clamp(0, 1, stop / maximum)))].sort((left, right) => left - right);
            return ScrollTrigger.snapDirectional(normalizedStops)(value, trigger.direction);
          }
        }
      });
      ScrollTrigger.refresh();
    }, page);

    return () => {
      context.revert();
      ScrollTrigger.removeEventListener("refreshInit", measureChapters);
      page.classList.remove("has-chapter-motion");
      page.style.removeProperty("--home-header-height");
    };
  }, []);

  return null;
}
