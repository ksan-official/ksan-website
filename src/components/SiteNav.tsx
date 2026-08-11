"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  ["홈", "/"],
  ["정착가이드", "/guides"],
  ["비즈니스 허브", "/business"],
  ["행사", "/events"],
  ["소개", "/about"],
  ["Pass it On", "/pass-it-on"],
  ["Community", "/community"],
  ["마이페이지", "/mypage"]
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Primary navigation">
      {navItems.map(([label, href]) => (
        <Link className={isActive(pathname, href) ? "active" : undefined} key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
