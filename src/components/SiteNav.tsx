"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createBrowserSupabaseClient, getBrowserSupabaseSession, hasSupabaseConfig } from "@/lib/supabase";

const navItems = [
  ["정착가이드", "/guides"],
  ["비즈니스 허브", "/business"],
  ["행사", "/events"],
  ["Pass it On", "/pass-it-on"],
  ["Community", "/community"]
];

const aboutItems = [
  ["KSAN 소개", "/about"],
  ["후원사 소개", "/about/sponsors"]
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(() => (hasSupabaseConfig() ? null : false));

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = createBrowserSupabaseClient();
    getBrowserSupabaseSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const accountLink = signedIn === false ? "/auth" : "/mypage";
  const accountLabel = signedIn === false ? "로그인" : "마이페이지";

  async function signOut() {
    if (!hasSupabaseConfig()) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setSignedIn(false);
    router.push("/auth");
    router.refresh();
  }

  return (
    <nav className="nav" aria-label="Primary navigation">
      {navItems.map(([label, href]) => (
        <Link
          className={[isActive(pathname, href) ? "active" : "", href === "/auth" ? "login-cta" : ""]
            .filter(Boolean)
            .join(" ")}
          key={href}
          href={href}
        >
          {label}
        </Link>
      ))}
      <div className={["nav-dropdown", isActive(pathname, "/about") ? "active" : ""].filter(Boolean).join(" ")}>
        <Link className="nav-dropdown-trigger" href="/about">
          소개
          <ChevronDown aria-hidden size={16} strokeWidth={2.4} />
        </Link>
        <div className="nav-dropdown-menu" role="menu">
          {aboutItems.map(([label, href]) => (
            <Link
              className={isActive(pathname, href) ? "active" : ""}
              href={href}
              key={href}
              role="menuitem"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <Link
        className={[isActive(pathname, accountLink) ? "active" : "", "login-cta"].filter(Boolean).join(" ")}
        href={accountLink}
      >
        {accountLabel}
      </Link>
      {signedIn === true ? (
        <button className="nav-text-button" onClick={() => void signOut()} type="button">
          로그아웃
        </button>
      ) : null}
    </nav>
  );
}
