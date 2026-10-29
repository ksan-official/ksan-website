import { HomeSectionIcon } from "@/components/HomeSectionIcon";

const orange = "var(--brand-dutch-orange)";
const light = "var(--brand-orange-200)";
const pale = "var(--brand-soft-peach)";
const deep = "var(--brand-orange-strong)";

export function SettlementCategoryArt({ category }: { category: string }) {
  if (category === "housing") return <HomeSectionIcon kind="guides" />;
  if (category === "living") return <HomeSectionIcon kind="market" />;
  if (category === "culture") return <HomeSectionIcon kind="events" />;

  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
      {category === "start" && <>
        <circle cx="40" cy="42" r="29" fill={light} />
        <circle cx="40" cy="40" r="23" fill={pale} />
        <path d="m51 22-5 24-20 12 8-27Z" fill={orange} />
        <path d="m40 40 6 6-20 12Z" fill={deep} />
        <circle cx="40" cy="40" r="4" fill={pale} />
      </>}
      {category === "residency" && <>
        <rect x="13" y="13" width="43" height="55" rx="6" fill={light} />
        <path d="M26 24h17M26 32h17" stroke={deep} strokeWidth="3" strokeLinecap="round" />
        <rect x="29" y="36" width="41" height="31" rx="5" fill={orange} />
        <circle cx="42" cy="47" r="5" fill={pale} />
        <path d="M34 61a8 8 0 0 1 16 0Z" fill={pale} />
        <path d="M56 46h7m-7 8h7" stroke={pale} strokeWidth="3" strokeLinecap="round" />
      </>}
      {category === "finance" && <>
        <rect x="10" y="26" width="58" height="39" rx="7" fill={deep} />
        <rect x="10" y="21" width="58" height="39" rx="7" fill={orange} />
        <path d="M10 31h58v8H10Z" fill={light} />
        <rect x="19" y="46" width="12" height="6" rx="2" fill={pale} />
        <circle cx="61" cy="59" r="12" fill={light} />
        <path d="M61 52v14m-4-11h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6" stroke={deep} strokeWidth="2" strokeLinecap="round" />
      </>}
      {category === "health" && <>
        <path d="M29 25v-7a5 5 0 0 1 5-5h12a5 5 0 0 1 5 5v7" stroke={deep} strokeWidth="5" />
        <rect x="10" y="24" width="60" height="44" rx="8" fill={light} />
        <rect x="10" y="24" width="60" height="13" rx="6" fill={orange} />
        <path d="M35 40h10v7h7v10h-7v7H35v-7h-7V47h7Z" fill={pale} />
      </>}
      {category === "transport" && <>
        <circle cx="21" cy="56" r="14" stroke={deep} strokeWidth="5" />
        <circle cx="61" cy="56" r="14" stroke={deep} strokeWidth="5" />
        <path d="m21 56 13-25 13 25H21Zm26 0 10-32m-23 7h21m-30-8h14m16 1h8" stroke={orange} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="47" cy="56" r="4" fill={light} />
      </>}
      {!["start", "residency", "finance", "health", "transport"].includes(category) && <>
        <path d="m10 24 20-7 20 7 20-7v43l-20 7-20-7-20 7Z" fill={light} />
        <path d="m30 17 20 7v43l-20-7Z" fill={orange} />
        <circle cx="40" cy="40" r="8" fill={pale} />
      </>}
    </svg>
  );
}
