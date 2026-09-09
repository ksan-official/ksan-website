"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

const adminLinks = [
  { href: "/admin", label: "현황" },
  { href: "/admin/guides", label: "정착가이드" },
  { href: "/admin/business", label: "채용" },
  { href: "/admin/events/new", label: "행사" },
  { href: "/admin/map-spots", label: "지도" },
  { href: "/admin/members", label: "회원" },
  { href: "/admin/about/new", label: "소개" },
  { href: "/admin/about/new?type=sponsor", label: "후원사" }
];

function AdminNavigation({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const aboutMode = searchParams.get("type") === "sponsor" ? "sponsor" : "team";

  function isActiveLink(href: string) {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/about/new") return pathname === "/admin/about/new" && aboutMode === "team";
    if (href === "/admin/about/new?type=sponsor") return pathname === "/admin/about/new" && aboutMode === "sponsor";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="admin-nav" aria-label="관리자 메뉴">
      {adminLinks.map((link) => (
        <Link className={isActiveLink(link.href) ? "is-active" : undefined} href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function AdminNavigationFallback() {
  return (
    <nav className="admin-nav" aria-label="관리자 메뉴">
      {adminLinks.map((link) => (
        <Link href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking" | "admin" | "guest">("checking");
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!hasSupabaseConfig()) {
        if (active) setAuthState("guest");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) setAuthState("guest");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      const role = (profile as { role?: string } | null)?.role;

      if (active) setAuthState(role === "admin" ? "admin" : "guest");
    }

    checkAdmin();
    const supabase = hasSupabaseConfig() ? createBrowserSupabaseClient() : null;
    const { data: listener } = supabase?.auth.onAuthStateChange(() => {
      checkAdmin();
    }) ?? { data: null };

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState === "checking") return;
    if (authState === "admin" && isLoginPage) router.replace("/admin");
    if (authState === "guest" && !isLoginPage) router.replace("/admin/login");
  }, [authState, isLoginPage, router]);

  async function signOut() {
    if (!hasSupabaseConfig()) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setAuthState("guest");
    router.replace("/admin/login");
    router.refresh();
  }

  if (authState === "checking") {
    return (
      <main className="admin-page admin-login-shell" id="main">
        <section className="admin-section admin-login-panel">
          <div className="admin-status-line">관리자 권한을 확인하는 중입니다.</div>
        </section>
      </main>
    );
  }

  if (isLoginPage) {
    if (authState === "admin") {
      return (
        <main className="admin-page admin-login-shell" id="main">
          <section className="admin-section admin-login-panel">
            <div className="admin-status-line">관리자 페이지로 이동하는 중입니다.</div>
          </section>
        </main>
      );
    }

    return <div className="admin-login-shell">{children}</div>;
  }

  if (authState !== "admin") {
    return (
      <main className="admin-page admin-login-shell" id="main">
        <section className="admin-section admin-login-panel">
          <div className="admin-status-line">관리자 로그인이 필요합니다.</div>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-sidebar">
        <div className="admin-topbar">
          <Link className="admin-brand" href="/admin">
            KSAN Admin
          </Link>
          <div className="admin-sidebar-foot">
            <Link className="admin-utility-link" href="/">
              <ExternalLink aria-hidden size={15} /> 사이트
            </Link>
            <button className="admin-sidebar-button" onClick={() => void signOut()} type="button">
              <LogOut aria-hidden size={15} /> 로그아웃
            </button>
          </div>
        </div>
        <Suspense fallback={<AdminNavigationFallback />}>
          <AdminNavigation pathname={pathname} />
        </Suspense>
      </header>
      <div className="admin-workspace">{children}</div>
    </div>
  );
}
