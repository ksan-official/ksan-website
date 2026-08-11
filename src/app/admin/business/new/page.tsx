"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function NewBusinessPostPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus("저장 실패: 관리자 계정으로 먼저 로그인해야 합니다.");
      return;
    }

    const response = await fetch("/api/admin/business", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({
        title: formData.get("title"),
        company: formData.get("company"),
        location: formData.get("location"),
        employmentType: formData.get("employmentType"),
        deadline: formData.get("deadline"),
        applyMode: formData.get("applyMode"),
        applyTarget: formData.get("applyTarget"),
        description: formData.get("description"),
        published: formData.get("published") === "on"
      })
    });
    const result = await response.json();
    setStatus(response.ok ? "공고가 저장되었습니다." : `저장 실패: ${result.error}`);
  }

  return (
    <main className="page">
      <h1 className="page-title">공고 등록</h1>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>제목</span><input name="title" required /></label>
        <label className="field"><span>기업명</span><input name="company" required /></label>
        <label className="field"><span>지역</span><input name="location" /></label>
        <label className="field"><span>근무 형태</span><input name="employmentType" /></label>
        <label className="field"><span>마감일</span><input name="deadline" type="date" /></label>
        <label className="field">
          <span>지원 방식</span>
          <select name="applyMode" defaultValue="email">
            <option value="email">Email</option>
            <option value="external_link">External link</option>
            <option value="internal_form">Internal form</option>
          </select>
        </label>
        <label className="field"><span>지원 이메일 또는 링크</span><input name="applyTarget" required /></label>
        <label className="field"><span>설명</span><textarea name="description" rows={6} required /></label>
        <label><input name="published" type="checkbox" /> 공개</label>
        <button className="button" type="submit">저장</button>
      </form>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
