"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { SiteNav } from "@/components/SiteNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");
  const adminTapCount = useRef(0);
  const adminTapTimer = useRef<number | null>(null);

  function openHiddenAdmin() {
    adminTapCount.current += 1;

    if (adminTapTimer.current) {
      window.clearTimeout(adminTapTimer.current);
    }

    adminTapTimer.current = window.setTimeout(() => {
      adminTapCount.current = 0;
    }, 1400);

    if (adminTapCount.current >= 3) {
      router.push("/admin");
    }
  }

  if (isAdmin) {
    return (
      <>
        <a className="skip-link" href="#main">
          본문으로 바로가기
        </a>
        {children}
      </>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 바로가기
      </a>
      <div className="shell">
        <header className="site-header">
          <Link className="brand" href="/">
            <span>KSAN</span>
            <small>네덜란드 한인 학생회</small>
          </Link>
          <SiteNav />
        </header>
        {children}
        <footer className="site-footer">
          <Link className="brand compact" href="/">
            KSAN
          </Link>
          <div className="footer-links">
            <Link href="/about">소개</Link>
            <Link href="/events">행사</Link>
            <Link href="/business">비즈니스 허브</Link>
            <Link href="/auth">로그인</Link>
          </div>
        </footer>
      </div>
      <button
        aria-label="관리자 페이지 열기"
        className="hidden-admin-hotspot"
        onClick={openHiddenAdmin}
        type="button"
      />
    </>
  );
}
