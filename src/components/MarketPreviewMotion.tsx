"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function MarketPreviewMotion() {
  useGSAP(() => {
    const page = document.querySelector<HTMLElement>("[data-market-page]");

    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.from("[data-market-hero] > *", {
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.12,
        y: 28
      });

      gsap.fromTo("[data-market-card]", {
        autoAlpha: 0,
        clipPath: "inset(0 0 100% 0)"
      }, {
        autoAlpha: 1,
        clipPath: "inset(0 0 0% 0)",
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          start: "top 84%",
          trigger: ".market-gated-preview"
        }
      });
    }, page);

    return () => context.revert();
  }, []);

  return null;
}
