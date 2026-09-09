"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
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
    <main className="admin-login-page" id="main">
      <header className="admin-login-intro">
        <div>
          <p>KSAN Admin</p>
          <h1>관리자 로그인</h1>
        </div>
      </header>

      <section className="admin-login-panel" aria-label="관리자 로그인">
        <div className="admin-login-panel-header">
          <span><LockKeyhole aria-hidden size={16} /> 운영자 전용</span>
          <strong>계정 확인</strong>
        </div>
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>이메일</span>
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label className="field">
            <span>비밀번호</span>
            <input autoComplete="current-password" name="password" minLength={8} required type="password" />
          </label>
          <button className="admin-login-submit" type="submit">
            관리자 로그인
            <ArrowRight aria-hidden size={17} />
          </button>
        </form>
        {status ? <p className="status">{status}</p> : null}
      </section>
    </main>
  );
}
