"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function NewAboutEntryPage() {
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

    const response = await fetch("/api/admin/about", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({
        entryType: formData.get("entryType"),
        title: formData.get("title"),
        subtitle: formData.get("subtitle"),
        body: formData.get("body"),
        imageUrl: formData.get("imageUrl"),
        sortOrder: formData.get("sortOrder"),
        published: formData.get("published") === "on"
      })
    });
    const result = await response.json();
    setStatus(response.ok ? "소개 항목이 저장되었습니다." : `저장 실패: ${result.error}`);
  }

  return (
    <main className="page" id="main">
      <p className="eyebrow">Admin · About</p>
      <h1 className="page-title">소개 항목 작성</h1>
      <p className="lead">
        회장단, 임원진, 팀원, 후원사처럼 자주 바뀌지는 않지만 교체가 필요한 소개 콘텐츠를 작성합니다.
      </p>
      <section className="section">
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>항목 종류</span>
            <select name="entryType" defaultValue="team_member">
              <option value="executive">임원진</option>
              <option value="president">회장단</option>
              <option value="team_member">팀원</option>
              <option value="sponsor">후원사</option>
            </select>
          </label>
          <label className="field">
            <span>제목</span>
            <input name="title" required placeholder="예: 2026 KSAN 회장단" />
          </label>
          <label className="field">
            <span>부제목</span>
            <input name="subtitle" placeholder="예: 운영팀 / 파트너십 / 후원사명" />
          </label>
          <label className="field">
            <span>본문</span>
            <textarea name="body" rows={7} placeholder="소개 문구를 작성합니다." />
          </label>
          <label className="field">
            <span>이미지 URL</span>
            <input name="imageUrl" placeholder="https://..." />
          </label>
          <label className="field">
            <span>정렬 순서</span>
            <input name="sortOrder" defaultValue="0" inputMode="numeric" />
          </label>
          <label>
            <input name="published" type="checkbox" /> 공개
          </label>
          <button className="button" type="submit">
            저장
          </button>
        </form>
        {status ? <p className="status">{status}</p> : null}
      </section>
    </main>
  );
}
