"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isLocalDesignMode } from "@/lib/design-preview";
import Image from "next/image";
import Link from "next/link";
import styles from "./auth.module.css";
import { SignupPreview } from "./SignupPreview";
import { createBrowserSupabaseClient, getBrowserSupabaseSession, hasSupabaseConfig } from "@/lib/supabase";

type AuthMode = "signin" | "signup" | "recover" | "sent" | "reset" | "complete";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const configured = hasSupabaseConfig();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    if (isLocalDesignMode && mode === "signin") {
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin") ? next : "/mypage");
      return;
    }
    if (mode === "recover") {
      changeMode("sent");
      return;
    }
    if (mode === "reset") {
      if (isLocalDesignMode) {
        changeMode("complete");
        return;
      }
      const resetData = new FormData(event.currentTarget);
      if (resetData.get("password") !== resetData.get("confirmPassword")) {
        setStatus("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
        (event.currentTarget.elements.namedItem("confirmPassword") as HTMLInputElement)?.focus();
        return;
      }
      changeMode("complete");
      return;
    }
    if (!configured) {
      setStatus("계정 기능이 아직 준비 중입니다.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const supabase = createBrowserSupabaseClient();
    setSubmitting(true);
    const result = await supabase.auth.signInWithPassword({ email, password }).catch((error: unknown) => ({
      data: { session: null },
      error: { message: error instanceof Error ? error.message : "로그인 요청에 실패했습니다." }
    }));
    setSubmitting(false);

    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    setStatus("처리되었습니다. 이메일 확인이 필요할 수 있습니다.");
    if (mode === "signin") {
      const next = new URLSearchParams(window.location.search).get("next");
      const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/mypage";
      if (result.data.session) {
        await supabase.auth.setSession(result.data.session);
      }
      const sessionResult = await getBrowserSupabaseSession();
      if (!sessionResult.data.session) {
        setStatus("로그인 세션이 저장되지 않았어요. 같은 주소에서 다시 로그인해주세요.");
        return;
      }
      setStatus("로그인되었습니다. 이동 중입니다.");
      window.location.assign(destination);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStatus(null);
  }

  return (
    <main className={styles.page} id="main">
      <section className={styles.panel} aria-labelledby="auth-title">
        <Link className={styles.brand} href="/" aria-label="KSAN 홈으로">
          <span>네덜란드에서 함께하는 우리</span>
          <Image src="/images/ksan-logo-black.png" alt="KSAN" width={1809} height={584} priority />
        </Link>
        <h1 className={mode === "signin" ? styles.srOnly : styles.title} id="auth-title">
          {mode === "signin" ? "KSAN 로그인" : mode === "signup" ? "회원가입" : mode === "recover" ? "비밀번호 찾기" : mode === "sent" ? "이메일을 확인해주세요" : mode === "reset" ? "비밀번호 재설정" : "비밀번호 변경 완료"}
        </h1>
        {mode === "recover" ? <p className={styles.description}>가입한 이메일로 재설정 링크를 안내해드릴게요.</p> : null}
        {mode === "reset" ? <p className={styles.description}>새로운 비밀번호를 8자 이상으로 입력해주세요.</p> : null}
        {mode === "signup" ? <SignupPreview /> : mode === "sent" || mode === "complete" ? (
          <div className={styles.result} role="status">
            <p>{mode === "sent" ? "이메일의 재설정 링크를 누르면 새로운 비밀번호를 설정할 수 있어요." : "새로운 비밀번호로 로그인해주세요."}</p>
            <button className={styles.submit} type="button" onClick={() => changeMode(mode === "sent" ? "reset" : "signin")}>
              {mode === "sent" ? "비밀번호 재설정" : "로그인하기"}
            </button>
            {mode === "sent" ? <button className={styles.textButton} type="button" onClick={() => changeMode("recover")}>이메일 다시 입력하기</button> : null}
          </div>
        ) : (


        <form className={styles.form} onSubmit={submit} key={mode}>
          {mode !== "reset" ? <label>
            <span className={styles.srOnly}>이메일 아이디</span>
            <input autoComplete={mode === "signin" ? "username" : "email"} name="email" placeholder="이메일 (아이디)" required type="email" />
          </label> : null}
          {mode !== "recover" ? (
            <label>
              <span className={styles.srOnly}>{mode === "reset" ? "새 비밀번호" : "비밀번호"}</span>
              <input autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={mode === "reset" ? 8 : undefined} name="password" placeholder={mode === "reset" ? "새 비밀번호 (8자 이상)" : "비밀번호"} required type="password" />
            </label>
          ) : null}
          {mode === "reset" ? <label>
            <span className={styles.srOnly}>새 비밀번호 확인</span>
            <input autoComplete="new-password" name="confirmPassword" placeholder="새 비밀번호 확인" required minLength={8} type="password" aria-describedby={status ? "auth-status" : undefined} />
          </label> : null}
          <button className={styles.submit} disabled={submitting} formNoValidate={isLocalDesignMode} type="submit">
            {submitting ? "확인 중…" : mode === "signin" ? "KSAN 로그인" : mode === "reset" ? "비밀번호 변경하기" : "재설정 링크 받기"}
          </button>
          {mode === "signin" ? (
            <div className={styles.options}>
              <label className={styles.remember}><input type="checkbox" name="remember" />로그인 유지</label>
              <button className={styles.textButton} type="button" onClick={() => changeMode("recover")}>아이디/비밀번호 찾기</button>
            </div>
          ) : null}
        </form>
        )}
        {status ? <p className={styles.status} id="auth-status" role="status">{status}</p> : null}
        {mode !== "complete" ? <button className={styles.switchMode} disabled={submitting} onClick={() => changeMode(mode === "signin" ? "signup" : "signin")} type="button">
          {mode === "signin" ? "회원가입" : "로그인으로 돌아가기"}
        </button> : null}
      </section>
      <footer className={styles.footer}>
        <button type="button" onClick={() => setStatus("이용약관 내용은 개발 시 연결됩니다.")}>이용약관</button>
        <button type="button" className={styles.privacy} onClick={() => setStatus("개인정보처리방침 내용은 개발 시 연결됩니다.")}>개인정보처리방침</button>
        <Link href="/about#contact">문의하기</Link>
        <span>© KSAN</span>
      </footer>
    </main>
  );
}
