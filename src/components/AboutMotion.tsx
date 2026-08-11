"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function AboutMotion() {
  useGSAP(() => {
    const page = document.querySelector<HTMLElement>("[data-about-page]");

    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .from("[data-about-hero-copy] > *", {
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.12,
          y: 34
        })
        .from(
          "[data-about-visual]",
          { autoAlpha: 0, duration: 1.15, scale: 0.88, x: 48 },
          "-=0.65"
        );

      gsap.utils.toArray<HTMLElement>("[data-story-card]").forEach((card, index) => {
        gsap.from(card, {
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          x: index % 2 === 0 ? 36 : -36,
          scrollTrigger: { start: "top 88%", trigger: card },
          y: 46
        });
      });

      gsap.from("[data-activity-card]", {
        autoAlpha: 0,
        duration: 1,
        ease: "power3.out",
        scale: 0.94,
        stagger: 0.1,
        scrollTrigger: { start: "top 82%", trigger: "[data-activity-grid]" },
        y: 64
      });

      gsap.utils.toArray<HTMLElement>("[data-about-section]").forEach((section) => {
        const heading = section.querySelector("h2");

        if (heading) {
          gsap.from(heading, {
            autoAlpha: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { start: "top 88%", trigger: heading },
            y: 30
          });
        }
      });

    }, page);

    return () => {
      context.revert();
    };
  }, []);

  return null;
}
