"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./AboutPage.module.css";

type TeamPanel = { id: string; label: string; content: ReactNode };

export function AboutTeamTabs({ panels }: { panels: TeamPanel[] }) {
  const prefix = useId();
  const [active, setActive] = useState(0);
  const tabId = (id: string) => `${prefix}-${id}-tab`;
  const panelId = (id: string) => `${prefix}-${id}-panel`;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = (active + 1) % panels.length; break;
      case "ArrowLeft": next = (active - 1 + panels.length) % panels.length; break;
      case "Home": next = 0; break;
      case "End": next = panels.length - 1; break;
      default: return;
    }

    event.preventDefault();
    setActive(next);
    document.getElementById(tabId(panels[next].id))?.focus();
  }

  return (
    <div>
      <div className={styles.teamTabs} role="tablist" aria-label="운영진 팀" onKeyDown={handleKeyDown}>
        {panels.map((panel, index) => (
          <button
            key={panel.id}
            type="button"
            role="tab"
            id={tabId(panel.id)}
            aria-controls={panelId(panel.id)}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
          >
            {panel.label}
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div
          key={panel.id}
          className={styles.teamPanel}
          role="tabpanel"
          id={panelId(panel.id)}
          aria-labelledby={tabId(panel.id)}
          hidden={active !== index}
          tabIndex={active === index ? 0 : -1}
        >
          {active === index ? panel.content : null}
        </div>
      ))}
    </div>
  );
}
