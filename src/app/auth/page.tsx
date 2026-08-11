"use client";

import { useState } from "react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<string | null>(null);
  const configured = hasSupabaseConfig();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) {
      setStatus("계정 기능이 아직 준비 중입니다.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const supabase = createBrowserSupabaseClient();
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: formData.get("name"),
                school: formData.get("school"),
                major: formData.get("major"),
                admission_year: formData.get("admissionYear")
              }
            }
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setStatus(result.error ? result.error.message : "처리되었습니다. 이메일 확인이 필요할 수 있습니다.");
  }

  return (
    <main className="page" id="main">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="page-title">{mode === "signin" ? "로그인" : "회원가입"}</h1>
          <p className="lead">
            가이드를 저장하고, 행사 신청 내역과 비즈니스 허브 활동을 확인하려면 계정이 필요합니다.
            학교 이메일 인증은 추후 적용될 수 있습니다.
          </p>
        </div>
        <aside className="ops-board">
          <span className={configured ? "badge live" : "badge pending"}>
            {configured ? "계정 연결 가능" : "계정 기능 준비 중"}
          </span>
          <p className="muted">
            첫 MVP에서는 프로필, 저장 항목, 신청 내역을 중심으로 계정 기능을 시작합니다.
          </p>
        </aside>
      </section>

      <section className="section">
        <form className="form" onSubmit={submit}>
        {mode === "signup" ? (
          <>
            <label className="field">
              <span>이름</span>
              <input name="name" required />
            </label>
            <label className="field">
              <span>학교</span>
              <input name="school" />
            </label>
            <label className="field">
              <span>전공</span>
              <input name="major" />
            </label>
            <label className="field">
              <span>입학연도</span>
              <input name="admissionYear" inputMode="numeric" />
            </label>
          </>
        ) : null}
        <label className="field">
          <span>이메일</span>
          <input name="email" required type="email" />
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input name="password" minLength={8} required type="password" />
        </label>
        <button className="button" type="submit">
          {mode === "signin" ? "로그인" : "가입하기"}
        </button>
        </form>
        <div className="button-row">
          <button className="button secondary" type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "회원가입으로 전환" : "로그인으로 전환"}
          </button>
        </div>
        {status ? <p className="status">{status}</p> : null}
      </section>
    </main>
  );
}
