"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function NewEventPage() {
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

    const response = await fetch("/api/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({
        title: formData.get("title"),
        startsAt: formData.get("startsAt"),
        location: formData.get("location"),
        description: formData.get("description"),
        registrationMode: formData.get("registrationMode"),
        registrationTarget: formData.get("registrationTarget"),
        published: formData.get("published") === "on"
      })
    });
    const result = await response.json();
    setStatus(response.ok ? "행사가 저장되었습니다." : `저장 실패: ${result.error}`);
  }

  return (
    <main className="page">
      <h1 className="page-title">행사 등록</h1>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>행사명</span><input name="title" required /></label>
        <label className="field"><span>일시</span><input name="startsAt" required type="datetime-local" /></label>
        <label className="field"><span>장소</span><input name="location" /></label>
        <label className="field"><span>설명</span><textarea name="description" rows={6} required /></label>
        <label className="field">
          <span>신청 방식</span>
          <select name="registrationMode" defaultValue="internal_form">
            <option value="internal_form">Internal form</option>
            <option value="google_form">Google Form</option>
            <option value="external_link">External link</option>
          </select>
        </label>
        <label className="field"><span>신청 링크</span><input name="registrationTarget" /></label>
        <label><input name="published" type="checkbox" /> 공개</label>
        <button className="button" type="submit">저장</button>
      </form>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
