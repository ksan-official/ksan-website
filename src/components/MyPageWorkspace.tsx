"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import { ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, House, MessageCircle, Search, ShoppingBag, UserRound, X } from "lucide-react";
import styles from "./MyPageWorkspace.module.css";

const SearchContext = createContext("");
export function useMyPageSearch() { return useContext(SearchContext); }
const items = [
  { href: "/mypage/business", label: "채용 활동", Icon: BriefcaseBusiness },
  { href: "/mypage/events", label: "신청한 이벤트", Icon: CalendarDays },
  { href: "/mypage/guides", label: "저장한 가이드", Icon: Bookmark },
  { href: "/mypage/community", label: "케이숲 기록", Icon: MessageCircle },
  { href: "/mypage/pass-it-on", label: "중고거래 기록", Icon: ShoppingBag },
  { href: "/mypage/profile", label: "프로필 설정", Icon: UserRound }
];

export function MyPageWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const searchable = pathname !== "/mypage/profile";
  return (
    <SearchContext.Provider value={searchable ? query : ""}>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <Link href="/" className={styles.logo} aria-label="KSAN 홈"><Image src="/images/ksan-logo-black.png" alt="KSAN" width={1809} height={584} priority /></Link>
          <nav aria-label="마이페이지 메뉴" className={styles.navigation}>
            <Link href="/" className={styles.home}><House size={18} aria-hidden />홈으로</Link>
            {items.map(({ href, label, Icon }) => {
              const active = pathname === href || (pathname === "/mypage" && href === "/mypage/business");
              return <Link href={href} key={href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined} onClick={() => setQuery("")}><Icon size={18} strokeWidth={1.6} aria-hidden /><span>{label}</span></Link>;
            })}
          </nav>
          <Link className={styles.help} href="/about#contact">문의하기 <ArrowUpRight size={14} aria-hidden /></Link>
        </aside>
        <div className={styles.body}>
          <header className={styles.topbar}>
            {searchable ? <div className={styles.search}>
              <Search size={17} aria-hidden />
              <input aria-label="내 항목 검색" placeholder="저장한 항목과 신청 내역 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
              {query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><X size={15} /></button>}
            </div> : <span className={styles.accountLabel}>내 계정</span>}
            <div className={styles.tools}>
              <Link href="/mypage/guides" aria-label="저장한 가이드" onClick={() => setQuery("")}><Bookmark size={19} strokeWidth={1.6} /></Link>
              <Link href="/mypage/profile" aria-label="프로필 설정" className={styles.account} onClick={() => setQuery("")}><UserRound size={19} strokeWidth={1.6} /></Link>
            </div>
          </header>
          {children}
        </div>
      </div>
    </SearchContext.Provider>
  );
}
