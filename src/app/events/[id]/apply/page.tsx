"use client";

import { useState } from "react";

export default function EventApplyPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("제출 중입니다.");
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "event_registration",
        targetId: params.id,
        name: formData.get("name"),
        email: formData.get("email"),
        school: formData.get("school"),
        major: formData.get("major"),
        admissionYear: formData.get("admissionYear"),
        message: formData.get("message")
      })
    });

    setStatus(response.ok ? "신청이 기록되었습니다." : "신청 저장 중 문제가 발생했습니다.");
  }

  return (
    <main className="page">
      <h1 className="page-title">행사 신청</h1>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>이름</span>
          <input name="name" required />
        </label>
        <label className="field">
          <span>이메일</span>
          <input name="email" required type="email" />
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
        <label className="field">
          <span>메시지</span>
          <textarea name="message" rows={5} />
        </label>
        <button className="button" type="submit">
          신청 제출
        </button>
      </form>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
