"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createBrowserSupabaseClient, getBrowserSupabaseSession, hasSupabaseConfig } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
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
                full_name: formData.get("name"),
                school: formData.get("school"),
                major: formData.get("major"),
                admission_year: formData.get("admissionYear")
              }
            }
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    setStatus("처리되었습니다. 이메일 확인이 필요할 수 있습니다.");
    if (mode === "signin") {
      const next = new URLSearchParams(window.location.search).get("next");
      const destination = next?.startsWith("/") ? next : "/mypage";
      if (result.data.session) {
        await supabase.auth.setSession(result.data.session);
      }
      const sessionResult = await getBrowserSupabaseSession();
      if (!sessionResult.data.session) {
        setStatus("로그인 세션이 저장되지 않았어요. 같은 주소에서 다시 로그인해주세요.");
        return;
      }
      router.replace(destination);
      window.location.href = destination;
    }
  }

  return (
    <main className="page auth-page" id="main">
      <section className="auth-shell">
        <section className="auth-card" aria-label={mode === "signin" ? "로그인" : "회원가입"}>
          <div className="auth-card-header">
            <Image
              alt="KSAN 네덜란드 한인 학생회"
              className="auth-logo"
              height={584}
              priority
              src="/images/ksan-logo-black.png"
              width={1809}
            />
            <div>
              <p className="eyebrow">KSAN Account</p>
              <h1>{mode === "signin" ? "로그인" : "회원가입"}</h1>
            </div>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === "signup" ? (
              <fieldset className="auth-fieldset">
                <legend>프로필 정보</legend>
                <div className="auth-form-grid">
                  <label className="field">
                    <span>이름</span>
                    <input name="name" placeholder="예: 홍길동" required />
                  </label>
                  <label className="field">
                    <span>학교</span>
                    <input name="school" placeholder="예: University of Amsterdam" />
                  </label>
                  <label className="field">
                    <span>전공</span>
                    <input name="major" placeholder="예: Business Administration" />
                  </label>
                  <label className="field">
                    <span>입학연도</span>
                    <input name="admissionYear" inputMode="numeric" placeholder="예: 2026" />
                  </label>
                </div>
              </fieldset>
            ) : null}
            <fieldset className={mode === "signup" ? "auth-fieldset auth-login-fieldset" : "auth-fieldset"}>
              {mode === "signup" ? <legend>로그인 정보</legend> : null}
              <label className="field">
                <span>이메일</span>
                <input autoComplete="email" name="email" required type="email" />
              </label>
              <label className="field">
                <span>비밀번호</span>
                <input autoComplete={mode === "signin" ? "current-password" : "new-password"} name="password" minLength={8} required type="password" />
              </label>
            </fieldset>
            <button className="auth-submit" type="submit">
              {mode === "signin" ? "마이페이지로 로그인" : "계정 만들기"}
              <ArrowRight aria-hidden size={18} />
            </button>
          </form>
          <button className="auth-mode-link" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} type="button">
            {mode === "signin" ? "회원가입하기" : "로그인으로 돌아가기"}
          </button>
          {status ? <p className="status auth-status">{status}</p> : null}
        </section>
      </section>
    </main>
  );
}
