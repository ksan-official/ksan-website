"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

type CursorState = {
  active: boolean;
  interactive: boolean;
  text: boolean;
  visible: boolean;
  x: number;
  y: number;
};

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("a, button, label, summary, select, [role='button'], input[type='button'], input[type='checkbox'], input[type='file'], input[type='radio'], input[type='reset'], input[type='submit']"));
}

function isTextTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("input:not([type]), input[type='email'], input[type='number'], input[type='password'], input[type='search'], input[type='tel'], input[type='text'], input[type='url'], textarea, [contenteditable='true']"));
}

export function CustomCursor() {
  const [cursor, setCursor] = useState<CursorState>({
    active: false,
    interactive: false,
    text: false,
    visible: false,
    x: 0,
    y: 0
  });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    document.body.classList.add("has-custom-cursor");

    function updatePosition(event: PointerEvent) {
      setCursor((current) => ({
        ...current,
        interactive: isInteractiveTarget(event.target),
        text: isTextTarget(event.target),
        visible: true,
        x: event.clientX,
        y: event.clientY
      }));
    }

    function setActive(active: boolean) {
      setCursor((current) => ({ ...current, active }));
    }

    function setVisible(visible: boolean) {
      setCursor((current) => ({ ...current, visible }));
    }

    const showActive = () => setActive(true);
    const hideActive = () => setActive(false);
    const hideCursor = () => setVisible(false);

    window.addEventListener("pointermove", updatePosition);
    window.addEventListener("pointerdown", showActive);
    window.addEventListener("pointerup", hideActive);
    window.addEventListener("pointerleave", hideCursor);
    window.addEventListener("blur", hideCursor);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", updatePosition);
      window.removeEventListener("pointerdown", showActive);
      window.removeEventListener("pointerup", hideActive);
      window.removeEventListener("pointerleave", hideCursor);
      window.removeEventListener("blur", hideCursor);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={[
        "custom-cursor",
        cursor.visible ? "is-visible" : "",
        cursor.active ? "is-active" : "",
        cursor.interactive ? "is-interactive" : "",
        cursor.text ? "is-text" : ""
      ].filter(Boolean).join(" ")}
      style={{
        "--cursor-x": `${cursor.x}px`,
        "--cursor-y": `${cursor.y}px`
      } as CSSProperties}
    >
      <span />
    </div>
  );
}
