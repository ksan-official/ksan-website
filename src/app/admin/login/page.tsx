"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const configured = hasSupabaseConfig();
  const [status, setStatus] = useState<string | null>(
    configured ? null : "Supabase 환경 변수가 설정되면 관리자 로그인을 사용할 수 있습니다."
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) {
      setStatus("Supabase 설정을 먼저 확인해주세요.");
      return;
    }

    setStatus("관리자 권한을 확인하는 중입니다.");
    const formData = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password"))
    });

    if (error || !data.user) {
      setStatus(error?.message ?? "로그인 정보를 확인하지 못했습니다.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = (profile as { role?: string } | null)?.role;

    if (profileError || role !== "admin") {
      await supabase.auth.signOut();
      setStatus("관리자 권한이 없는 계정입니다.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Administration</p>
          <h1>관리자 로그인</h1>
          <p>운영자 계정으로 로그인하면 관리자 현황, 회원 목록, 콘텐츠 관리 도구를 사용할 수 있습니다.</p>
        </div>
      </header>

      <section className="admin-section admin-login-panel">
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>관리자 이메일 *</span>
            <input name="email" required type="email" />
          </label>
          <label className="field">
            <span>비밀번호 *</span>
            <input name="password" minLength={8} required type="password" />
          </label>
          <button className="admin-button" type="submit">
            관리자 로그인
          </button>
        </form>
        {status ? <p className="status">{status}</p> : null}
      </section>
    </main>
  );
}
