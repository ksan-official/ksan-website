"use client";

import { useState } from "react";
import Link from "next/link";
import { isLocalDesignMode } from "@/lib/design-preview";
import { Clock3 } from "lucide-react";
import styles from "./auth.module.css";

const identities = {
  student: { label: "재학생", method: "학교 이메일 인증", document: "" },
  incoming: { label: "입학예정자", method: "입학허가서 제출 · 관리자 확인", document: "입학허가서" },
  graduate: { label: "졸업생", method: "졸업증명서 제출 · 관리자 확인", document: "졸업증명서" }
};
type Identity = keyof typeof identities;

type SignupStep = "signup" | "joined" | "verify" | "pending";

export function SignupPreview({ initialStep = "signup" }: { initialStep?: SignupStep }) {
  const [step, setStep] = useState<SignupStep>(initialStep);
  const [nickname, setNickname] = useState(initialStep === "signup" ? "" : "운하산책");
  const [identity, setIdentity] = useState<Identity>("student");
  const current = identities[identity];

  if (step === "signup") {
    return (
      <form className={styles.form} onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const value = String(formData.get("nickname") ?? "").trim();
        if (!value && !isLocalDesignMode) return;
        setNickname(value || "운하산책");
        setStep("joined");
      }}>
        <p className={styles.signupIntro}>학교 이메일이 없어도 가입할 수 있어요.<br />신분 인증은 가입 후 진행해주세요.</p>
        <label><span className={styles.srOnly}>닉네임</span><input name="nickname" placeholder="닉네임" required minLength={2} maxLength={20} pattern=".*\S.*" autoComplete="nickname" /></label>
        <p className={styles.fieldHint}>글, 댓글, 중고거래 등 모든 활동에 닉네임이 표시됩니다.</p>
        <label><span className={styles.srOnly}>가입 이메일</span><input name="email" placeholder="이메일" type="email" required autoComplete="email" /></label>
        <label><span className={styles.srOnly}>가입 비밀번호</span><input name="password" placeholder="비밀번호 (8자 이상)" type="password" required minLength={8} autoComplete="new-password" /></label>
        <button className={styles.submit} formNoValidate={isLocalDesignMode} type="submit">가입하기</button>
      </form>
    );
  }

  return (
    <div className={styles.verification}>
      {step !== "joined" && <div className={styles.memberPreview}>
        <strong>{nickname}</strong>
        <span className={styles.memberBadge}>{step === "pending" ? <Clock3 size={14} aria-hidden /> : null}{step === "pending" ? `${current.label} · 확인 대기` : "미인증"}</span>
      </div>}
      {step === "joined" ? (
        <>
          <h2>반가워요, {nickname}님</h2>
          <p>인증하면 닉네임 옆에 Verified 배지가 표시돼요.<br />중고거래에서도 인증 여부를 확인할 수 있어요.</p>
          <div className={styles.memberPreview} aria-label="인증 후 닉네임 표시">
            <strong>{nickname}</strong>
            <span className={styles.verifiedBadge} role="img" aria-label="Verified 인증 배지">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" fill="currentColor" />
                <path d="m7.8 12 2.8 2.8 5.6-5.6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <button className={styles.submit} type="button" onClick={() => setStep("verify")}>인증하기</button>
          <Link className={styles.textButton} href="/mypage">나중에 하기</Link>
        </>
      ) : step === "verify" ? (
        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); setStep("pending"); }}>
          <fieldset className={styles.identityChoices}>
            <legend>어떤 신분으로 인증할까요?</legend>
            <div>{Object.entries(identities).map(([key, item]) => (
              <label key={key}><input type="radio" name="identity" value={key} checked={identity === key} onChange={() => setIdentity(key as Identity)} /><span>{item.label}</span></label>
            ))}</div>
          </fieldset>
          <p className={styles.method}>{current.method}</p>
          <label><span className={styles.inputLabel}>실명</span><input name="legalName" autoComplete="name" placeholder="인증 자료와 동일한 이름" required /></label>
          <p className={styles.fieldHint}>실명은 관리자에게만 공개되며, 다른 회원에게는 닉네임만 표시됩니다.</p>
          {identity === "student" ? (
            <label><span className={styles.inputLabel}>학교 이메일</span><input name="schoolEmail" type="email" placeholder="학교에서 발급한 이메일" required autoComplete="off" /></label>
          ) : (
            <label className={styles.documentUpload} key={identity}><span className={styles.inputLabel}>{current.document}</span><input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png" required /><span className={styles.fieldHint}>PDF, JPG, PNG</span></label>
          )}
          <button className={styles.submit} formNoValidate={isLocalDesignMode} type="submit">{identity === "student" ? "인증 메일 받기" : "인증 요청하기"}</button>
        </form>
      ) : (
        <div className={styles.result} role="status">
          <h2>{identity === "student" ? "학교 이메일 확인 대기" : "관리자 확인 대기"}</h2>
          <p>{identity === "student" ? "학교 이메일로 받은 인증 링크를 확인하면 Verified 배지가 표시됩니다." : `${current.document}를 관리자가 확인한 뒤 Verified 배지가 표시됩니다.`}</p>
          <button className={styles.textButton} type="button" onClick={() => setStep("verify")}>인증 정보 다시 입력하기</button>
        </div>
      )}

    </div>
  );
}
