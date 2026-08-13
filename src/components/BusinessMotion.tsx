"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function BusinessMotion() {
  useGSAP(() => {
    const page = document.querySelector<HTMLElement>("[data-business-page]");
    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.from("[data-business-hero] > *", {
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        y: 28
      });

      gsap.fromTo("[data-featured-rail]", { scale: 0.96 }, {
        ease: "none",
        scale: 1,
        scrollTrigger: { end: "center 58%", scrub: 0.6, start: "top 90%", trigger: "[data-featured-rail]" }
      });

      gsap.utils.toArray<HTMLElement>("[data-job-card]").forEach((card, index) => {
        gsap.from(card, {
          autoAlpha: 0,
          delay: (index % 3) * 0.06,
          duration: 0.72,
          ease: "power3.out",
          scrollTrigger: { start: "top 91%", trigger: card },
          y: 34
        });
      });

    }, page);

    return () => context.revert();
  }, []);

  return null;
}
