"use client";

import { useEffect, useState } from "react";

type PaletteKey = "p1" | "p4";

const palettes = [
  { key: "p1" as const, label: "P1", note: "Navy / Cyan" },
  { key: "p4" as const, label: "P4", note: "Teal / Indigo" }
];

export function PaletteTabs() {
  const [activePalette, setActivePalette] = useState<PaletteKey>("p1");

  useEffect(() => {
    document.documentElement.dataset.palette = activePalette;
  }, [activePalette]);

  return (
    <div className="palette-tabs" aria-label="Color palette preview">
      {palettes.map((palette) => (
        <button
          aria-pressed={activePalette === palette.key}
          className="palette-tab"
          key={palette.key}
          onClick={() => setActivePalette(palette.key)}
          type="button"
        >
          <i aria-hidden="true" className="palette-swatch" />
          <span>{palette.label}</span>
          <small>{palette.note}</small>
        </button>
      ))}
    </div>
  );
}
