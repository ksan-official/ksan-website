"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeMotion() {
  useGSAP(() => {
    const page = document.querySelector<HTMLElement>("[data-home-page]");

    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .from("[data-hero-copy] > *", {
          autoAlpha: 0,
          duration: 0.85,
          stagger: 0.1,
          y: 30
        })
        .from(
          "[data-hero-board]",
          {
            autoAlpha: 0,
            duration: 1,
            rotate: 1.5,
            scale: 0.94,
            x: 32
          },
          "-=0.62"
        )
        .from(
          "[data-hero-board] .flow-step",
          {
            autoAlpha: 0,
            duration: 0.65,
            stagger: 0.09,
            y: 22
          },
          "-=0.58"
        );

      gsap.fromTo(
        "[data-hero-art]",
        { autoAlpha: 0.05, scale: 0.82 },
        {
          autoAlpha: 0.18,
          ease: "none",
          scale: 1.08,
          scrollTrigger: {
            end: "bottom top",
            scrub: 0.8,
            start: "top top",
            trigger: ".hero-panel"
          }
        }
      );

      gsap.fromTo(
        "[data-scrub-copy]",
        { opacity: 0.42 },
        {
          ease: "none",
          opacity: 1,
          scrollTrigger: {
            end: "bottom 38%",
            scrub: 0.6,
            start: "top 74%",
            trigger: "[data-scrub-copy]"
          }
        }
      );

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
    }, page);

    return () => context.revert();
  }, []);

  return null;
}
