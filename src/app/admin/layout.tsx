"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

const adminLinks = [
  { href: "/admin", label: "현황" },
  { href: "/admin/guides", label: "정착가이드 관리" },
  { href: "/admin/business", label: "채용 공고 관리" },
  { href: "/admin/events/new", label: "행사 등록" },
  { href: "/admin/map-spots", label: "지도 장소 관리" },
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/about/new", label: "소개 수정" }
];

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
      if (role !== "admin") await supabase.auth.signOut();
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
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          KSAN Admin
        </Link>
        <nav className="admin-nav" aria-label="관리자 메뉴">
          {adminLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <Link href="/">공개 사이트 보기</Link>
        </div>
      </aside>
      <div className="admin-workspace">{children}</div>
    </div>
  );
}
