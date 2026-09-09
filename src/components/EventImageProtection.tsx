"use client";

import { useEffect } from "react";

function isProtectedImageTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("[data-protected-event-image]"));
}

export function EventImageProtection() {
  useEffect(() => {
    function preventImageAction(event: Event) {
      if (isProtectedImageTarget(event.target)) event.preventDefault();
    }

    document.addEventListener("contextmenu", preventImageAction, true);
    document.addEventListener("dragstart", preventImageAction, true);

    return () => {
      document.removeEventListener("contextmenu", preventImageAction, true);
      document.removeEventListener("dragstart", preventImageAction, true);
    };
  }, []);

  return null;
}
