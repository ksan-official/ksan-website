type HomeSectionIconKind = "guides" | "career" | "events" | "market" | "community" | "map";

const palette = {
  pale: "var(--brand-soft-peach)",
  light: "var(--brand-orange-200)",
  medium: "color-mix(in srgb, var(--brand-dutch-orange) 65%, var(--brand-soft-peach))",
  orange: "var(--brand-dutch-orange)",
  deep: "var(--brand-orange-strong)",
  dark: "var(--brand-orange-strong)"
};

export function HomeSectionIcon({ kind }: { kind: HomeSectionIconKind }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 80 80" fill="none">
      {kind === "guides" && (
        <>
          <path d="M12 35 35 15a5 5 0 0 1 6 0l23 20v28a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5Z" fill={palette.light} />
          <path d="m8 36 28-24a4 4 0 0 1 5 0l28 24a4 4 0 0 1-5 6L39 21 13 42a4 4 0 0 1-5-6Z" fill={palette.orange} />
          <rect x="23" y="43" width="13" height="25" rx="3" fill={palette.deep} />
          <path d="M44 39c8-4 15-3 24 1v28c-9-4-16-5-24-1Z" fill={palette.orange} />
          <path d="M44 39c-4-2-8-3-12-2v28c4-1 8 0 12 2Z" fill={palette.pale} />
          <path d="m50 47 11 2m-11 6 11 2" stroke={palette.pale} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === "career" && (
        <>
          <path d="M29 29v-8a5 5 0 0 1 5-5h12a5 5 0 0 1 5 5v8" stroke={palette.dark} strokeWidth="6" strokeLinecap="round" />
          <rect x="42" y="13" width="20" height="36" rx="3" transform="rotate(12 42 13)" fill={palette.light} />
          <path d="m47 23 10 2m-11 5 8 2" stroke={palette.deep} strokeWidth="3" strokeLinecap="round" />
          <rect x="9" y="28" width="62" height="40" rx="7" fill={palette.deep} />
          <path d="M9 35a7 7 0 0 1 7-7h48a7 7 0 0 1 7 7v10c-19 10-43 10-62 0Z" fill={palette.orange} />
          <rect x="35" y="43" width="10" height="12" rx="3" fill={palette.pale} />
        </>
      )}
      {kind === "events" && (
        <>
          <rect x="13" y="19" width="54" height="52" rx="7" fill={palette.light} />
          <path d="M13 26a7 7 0 0 1 7-7h40a7 7 0 0 1 7 7v11H13Z" fill={palette.orange} />
          <path d="M27 14v13m26-13v13" stroke={palette.dark} strokeWidth="5" strokeLinecap="round" />
          <rect x="23" y="46" width="7" height="7" rx="2" fill={palette.deep} />
          <rect x="36" y="46" width="7" height="7" rx="2" fill={palette.deep} />
          <rect x="23" y="58" width="7" height="7" rx="2" fill={palette.deep} />
          <path d="m54 44 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill={palette.orange} />
        </>
      )}
      {kind === "market" && (
        <>
          <path d="M29 27h33l5 39a4 4 0 0 1-4 5H28a4 4 0 0 1-4-5Z" fill={palette.medium} />
          <path d="M36 32V22a9 9 0 0 1 18 0v10" stroke={palette.dark} strokeWidth="5" strokeLinecap="round" />
          <rect x="9" y="44" width="31" height="27" rx="3" fill={palette.deep} />
          <rect x="7" y="39" width="35" height="9" rx="3" fill={palette.orange} />
          <path d="M22 40c-12 0-14-12-7-12 5 0 9 8 9 12Zm3 0c12 0 14-12 7-12-5 0-9 8-9 12Z" fill={palette.light} />
          <path d="M21 39h7v32h-7Z" fill={palette.pale} />
        </>
      )}
      {kind === "community" && (
        <>
          <path d="M38 29h23a12 12 0 0 1 12 12v10a12 12 0 0 1-12 12h-2l-1 9-13-9h-7a12 12 0 0 1-12-12V41a12 12 0 0 1 12-12Z" fill={palette.light} />
          <path d="M20 13h25a13 13 0 0 1 13 13v13a13 13 0 0 1-13 13H31L17 62l1-10A13 13 0 0 1 7 39V26a13 13 0 0 1 13-13Z" fill={palette.orange} />
          <circle cx="22" cy="33" r="3" fill={palette.pale} />
          <circle cx="33" cy="33" r="3" fill={palette.pale} />
          <circle cx="44" cy="33" r="3" fill={palette.pale} />
        </>
      )}
      {kind === "map" && (
        <>
          <path d="m8 31 20-8 23 8 20-8v42l-20 8-23-8-20 8Z" fill={palette.light} />
          <path d="m28 23 23 8v42l-23-8Z" fill={palette.medium} />
          <path d="m8 51 20-8 23 8 20-8" stroke={palette.pale} strokeWidth="4" strokeLinejoin="round" />
          <path d="M58 24c0 10-14 24-14 24S30 34 30 24a14 14 0 0 1 28 0Z" fill={palette.deep} />
          <circle cx="44" cy="24" r="5" fill={palette.pale} />
        </>
      )}
    </svg>
  );
}
