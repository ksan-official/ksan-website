"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

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
    const nameKo = String(formData.get("nameKo") ?? "");
    const admissionYear = String(formData.get("startYear") ?? "");
    const consentTimestamp = new Date().toISOString();
    const supabase = createBrowserSupabaseClient();
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: nameKo,
                name_ko: nameKo,
                residence_city: formData.get("residenceCity"),
                school: formData.get("school"),
                student_status: formData.get("studentStatus"),
                birth_date: formData.get("birthDate"),
                gender: formData.get("gender"),
                degree: formData.get("degree"),
                major: formData.get("major"),
                admission_year: admissionYear,
                admission_or_stay_start_year: admissionYear,
                privacy_consent: formData.get("privacyConsent") === "on",
                privacy_consented_at: consentTimestamp,
                terms_consent: formData.get("termsConsent") === "on",
                terms_consented_at: consentTimestamp
              }
            }
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    if (mode === "signin") {
      router.push("/mypage");
      return;
    }

    setStatus("가입이 접수되었습니다. 이메일 확인이 필요할 수 있습니다.");
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
      </section>

      <section className="section">
        <form className="form" onSubmit={submit}>
        <label className="field">
          <span>이메일 *</span>
          <input name="email" placeholder="honggildong@ksan.nl" required type="email" />
        </label>
        <label className="field">
          <span>비밀번호 *</span>
          <input name="password" minLength={8} placeholder="8자 이상 입력" required type="password" />
        </label>
        {mode === "signup" ? (
          <>
            <label className="field">
              <span>이름 (한글) *</span>
              <input name="nameKo" placeholder="홍길동" required />
            </label>
            <label className="field">
              <span>현재 거주 도시 *</span>
              <input name="residenceCity" placeholder="예: Amsterdam" required />
            </label>
            <label className="field">
              <span>학교 / 소속 *</span>
              <input name="school" placeholder="예: University of Amsterdam" required />
            </label>
            <label className="field">
              <span>학생 여부 *</span>
              <select name="studentStatus" required defaultValue="">
                <option value="" disabled>선택하세요</option>
                <option value="current_student">재학생</option>
                <option value="exchange_student">교환학생</option>
                <option value="graduate">졸업생</option>
                <option value="non_student">비학생</option>
              </select>
            </label>

            <div className="form-grid">
              <label className="field">
                <span>생년월일 (선택)</span>
                <input name="birthDate" type="date" />
              </label>
              <label className="field">
                <span>성별 (선택)</span>
                <select name="gender" defaultValue="">
                  <option value="">선택 안 함</option>
                  <option value="female">여성</option>
                  <option value="male">남성</option>
                  <option value="non_binary">논바이너리</option>
                  <option value="prefer_not_to_say">응답하지 않음</option>
                </select>
              </label>
              <label className="field">
                <span>학위 (선택)</span>
                <select name="degree" defaultValue="">
                  <option value="">선택 안 함</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                  <option value="phd">PhD</option>
                  <option value="exchange">Exchange</option>
                  <option value="other">기타</option>
                </select>
              </label>
              <label className="field">
                <span>전공 (선택)</span>
                <input name="major" placeholder="예: Business Administration" />
              </label>
              <label className="field">
                <span>입학 / 체류 시작연도 (선택)</span>
                <input name="startYear" inputMode="numeric" maxLength={4} placeholder="예: 2026" />
              </label>
            </div>

            <label className="check-field">
              <input name="privacyConsent" required type="checkbox" />
              <span>개인정보 처리에 동의합니다. *</span>
            </label>
            <label className="check-field">
              <input name="termsConsent" required type="checkbox" />
              <span>이용약관에 동의합니다. *</span>
            </label>
          </>
        ) : null}
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
