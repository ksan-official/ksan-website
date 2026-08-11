"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

export function AboutContactFab() {
  const [isContactVisible, setIsContactVisible] = useState(false);

  useEffect(() => {
    const contactSection = document.querySelector<HTMLElement>("#contact");

    if (!contactSection) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsContactVisible(entry.isIntersecting),
      { rootMargin: "-8% 0px -18% 0px", threshold: 0.08 }
    );

    observer.observe(contactSection);
    return () => observer.disconnect();
  }, []);

  return (
    <a
      aria-hidden={isContactVisible}
      aria-label="문의하기 섹션으로 이동"
      className={`about-contact-fab${isContactVisible ? " is-hidden" : ""}`}
      href="#contact"
      tabIndex={isContactVisible ? -1 : 0}
    >
      <span>문의하기</span>
      <ArrowDown size={19} aria-hidden />
    </a>
  );
}
