"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { PaletteTabs } from "@/components/PaletteTabs";
import { SiteNav } from "@/components/SiteNav";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");
  const [signedIn, setSignedIn] = useState(false);
  const adminTapCount = useRef(0);
  const adminTapTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig() || isAdmin) return;

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => listener.subscription.unsubscribe();
  }, [isAdmin]);

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
          <Link aria-label="KSAN 홈" className="brand brand-logo" href="/">
            <Image
              alt="KSAN 네덜란드 한인 학생회"
              height={584}
              priority
              src="/images/ksan-logo-black.png"
              width={1809}
            />
          </Link>
          <SiteNav />
          <PaletteTabs />
        </header>
        {children}
        <footer className="site-footer">
          <div className="footer-grid">
            <div className="footer-identity">
              <Link aria-label="KSAN 홈" className="brand brand-logo compact" href="/">
                <Image
                  alt="KSAN 네덜란드 한인 학생회"
                  height={584}
                  src="/images/ksan-logo-black.png"
                  width={1809}
                />
              </Link>
              <p>네덜란드의 한국 학생들이 필요한 정보를 찾고, 서로 연결되도록 돕습니다.</p>
            </div>
            <nav aria-label="하단 주요 메뉴" className="footer-sitemap">
              <span className="footer-label">Navigation</span>
              <Link href="/guides">정착가이드</Link>
              <Link href="/business">비즈니스 허브</Link>
              <Link href="/events">행사</Link>
              <Link href="/pass-it-on">Pass it On</Link>
              <Link href="/community">Community</Link>
              <Link href="/about">소개</Link>
            </nav>
            <div className="footer-account">
              <span className="footer-label">My KSAN</span>
              <Link href={signedIn ? "/mypage" : "/auth"}>{signedIn ? "마이페이지" : "로그인"}</Link>
              <p>저장한 가이드와 관심 공고를 한곳에서 확인하세요.</p>
            </div>
          </div>
          <div className="footer-contact-strip">
            <div>
              <span className="footer-label">Contact KSAN</span>
              <strong>궁금한 점이 있거나 함께하고 싶다면</strong>
            </div>
            <Link className="footer-contact" href="/about#contact">
              <span>문의하기</span>
              <ArrowUpRight aria-hidden size={18} />
            </Link>
          </div>
          <div className="footer-meta">
            <span>© 2026 KSAN</span>
            <span>KSAN · Korean Students Association in the Netherlands</span>
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
