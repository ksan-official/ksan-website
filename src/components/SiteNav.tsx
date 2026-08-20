"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

const navItems = [
  ["정착가이드", "/guides"],
  ["비즈니스 허브", "/business"],
  ["행사", "/events"],
  ["Pass it On", "/pass-it-on"],
  ["Community", "/community"],
  ["소개", "/about"]
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const accountLink = signedIn ? "/mypage" : "/auth";
  const accountLabel = signedIn ? "마이페이지" : "로그인";

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
      <Link
        className={[isActive(pathname, accountLink) ? "active" : "", "login-cta"].filter(Boolean).join(" ")}
        href={accountLink}
      >
        {accountLabel}
      </Link>
    </nav>
  );
}
