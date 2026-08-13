"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function NewBusinessPostPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("저장 중입니다.");
    const formData = new FormData(event.currentTarget);

    try {
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
          accent: formData.get("accent"),
          applyMode: formData.get("applyMode"),
          applyTarget: formData.get("applyTarget"),
          company: formData.get("company"),
          deadline: formData.get("deadline"),
          department: formData.get("department"),
          description: formData.get("description"),
          employmentType: formData.get("employmentType"),
          featured: formData.get("featured") === "on",
          featuredOrder: formData.get("featuredOrder"),
          location: formData.get("location"),
          published: formData.get("published") === "on",
          tags: String(formData.get("tags") ?? "").split(","),
          title: formData.get("title")
        })
      });
      const result = await response.json();
      setStatus(response.ok ? "공고가 저장되었습니다. 공개 페이지에 반영됩니다." : `저장 실패: ${result.error}`);
      if (response.ok) event.currentTarget.reset();
    } catch (error) {
      setStatus(`저장 실패: ${error instanceof Error ? error.message : "Supabase 설정을 확인해주세요."}`);
    }
  }

  return (
    <main className="page" id="main">
      <div className="admin-page-header">
        <div><p className="admin-kicker">Business Hub</p><h1 className="page-title">채용 공고 등록</h1><p>공고 내용, 검색 태그, 하이라이트 배너 노출을 함께 설정합니다.</p></div>
        <Link className="admin-button secondary" href="/admin/business">전체 공고 관리</Link>
      </div>
      <form className="form" onSubmit={submit}>
        <div className="admin-two-column">
          <label className="field"><span>직무명</span><input name="title" required /></label>
          <label className="field"><span>기업명</span><input name="company" required /></label>
          <label className="field"><span>직무 분야</span><input name="department" placeholder="Marketing, Product, Design" required /></label>
          <label className="field"><span>지역</span><input name="location" placeholder="Amsterdam, Remote" required /></label>
          <label className="field">
            <span>고용 형태</span>
            <select defaultValue="인턴" name="employmentType">
              <option>풀타임</option><option>워킹 스튜던트</option><option>파트타임</option><option>인턴</option><option>계약직</option>
            </select>
          </label>
          <label className="field"><span>마감일</span><input name="deadline" type="date" /></label>
        </div>
        <label className="field"><span>검색 태그</span><input name="tags" placeholder="영어 가능, 학생 우대, 브랜딩" /></label>
        <p className="admin-note">쉼표로 구분해 최대 8개까지 등록할 수 있습니다. 검색과 공고 카드의 태그에 사용됩니다.</p>
        <div className="admin-two-column">
          <label className="field">
            <span>지원 방식</span>
            <select name="applyMode" defaultValue="email">
              <option value="email">이메일</option><option value="external_link">외부 링크</option><option value="internal_form">내부 지원 폼</option>
            </select>
          </label>
          <label className="field"><span>지원 이메일 또는 링크</span><input name="applyTarget" required /></label>
        </div>
        <label className="field"><span>상세 설명</span><textarea name="description" rows={6} required /></label>
        <div className="admin-two-column">
          <label className="field">
            <span>배너 컬러</span>
            <select defaultValue="orange" name="accent"><option value="orange">Dutch Orange</option><option value="blue">Ice Blue</option><option value="dark">Slate Obsidian</option></select>
          </label>
          <label className="field"><span>배너 순서</span><input defaultValue="0" min="0" name="featuredOrder" type="number" /></label>
        </div>
        <div className="admin-publish-options">
          <label className="admin-check"><input name="published" type="checkbox" /> 공개 페이지에 게시</label>
          <label className="admin-check"><input name="featured" type="checkbox" /> 하이라이트 배너로 노출</label>
        </div>
        <p className="admin-note">하이라이트는 최대 3개까지 지정할 수 있습니다.</p>
        <button className="button" type="submit">공고 저장</button>
      </form>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
