"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { deriveSummary, parseGuideText, slugFromTitle } from "@/lib/guideParser";

const sampleText = `# BSN 신청부터 수령까지 A to Z

네덜란드에 막 도착해서 BSN을 받아야 하는 학생을 위한 가이드입니다.

## BSN이 무엇인가요?
BSN은 네덜란드 정부가 거주자에게 부여하는 고유 번호입니다.

## 신청 절차
- Gemeente 예약
- 필요 서류 준비
- 방문 등록
- BSN 수령

## 자주 묻는 질문
예약이 늦어질 수 있으니 도착 전 가능한 날짜를 먼저 확인하세요.`;

export default function NewGuidePage() {
  const [status, setStatus] = useState<string | null>(null);
  const [rawText, setRawText] = useState(sampleText);
  const [title, setTitle] = useState("BSN 신청부터 수령까지 A to Z");
  const [slug, setSlug] = useState("bsn-a-to-z");
  const [summary, setSummary] = useState(deriveSummary(sampleText));
  const blocks = useMemo(() => parseGuideText(rawText), [rawText]);
  const headings = blocks.filter((block) => block.type.startsWith("heading"));

  function scanContent() {
    const firstHeading = blocks.find((block) => block.type === "heading_1" || block.type === "heading_2");
    const nextTitle = firstHeading?.text ?? title;
    setTitle(nextTitle);
    setSlug(slugFromTitle(nextTitle));
    setSummary(deriveSummary(rawText));
    setStatus("본문을 스캔해서 제목, slug, 요약, 목차를 갱신했습니다.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus("저장 실패: 관리자 계정으로 먼저 로그인해야 합니다.");
      return;
    }

    const response = await fetch("/api/admin/guides", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({
        title,
        slug,
        summary,
        rawText,
        category: formData.get("category"),
        author: formData.get("author"),
        tags: formData.get("tags"),
        published: formData.get("published") === "on"
      })
    });
    const result = await response.json();
    setStatus(response.ok ? `가이드가 저장되었습니다. /guides/${result.slug}` : `저장 실패: ${result.error}`);
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">정착가이드</p>
          <h1>글 작성</h1>
          <p>본문을 붙여넣고 스캔한 뒤 저장합니다. 공개 체크를 켜야 사이트에 보입니다.</p>
        </div>
        <Link className="admin-button secondary" href="/admin/guides">
          목록으로
        </Link>
      </header>

      <section className="admin-editor-layout">
        <form className="admin-form" onSubmit={submit}>
          <label className="field">
            <span>본문 붙여넣기</span>
            <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={14} />
          </label>
          <button className="admin-button secondary" type="button" onClick={scanContent}>
            본문 스캔
          </button>
          <label className="field">
            <span>제목</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="field">
            <span>Slug</span>
            <input value={slug} onChange={(event) => setSlug(event.target.value)} required />
          </label>
          <label className="field">
            <span>카테고리</span>
            <input name="category" defaultValue="행정 · 비자" />
          </label>
          <label className="field">
            <span>요약</span>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
          </label>
          <label className="field">
            <span>작성자</span>
            <input name="author" defaultValue="KSAN 기획총괄팀" />
          </label>
          <label className="field">
            <span>태그</span>
            <input name="tags" defaultValue="BSN, 행정, 정착" />
          </label>
          <label>
            <input name="published" type="checkbox" /> 공개
          </label>
          <button className="admin-button" type="submit">
            저장
          </button>
          {status ? <p className="status">{status}</p> : null}
        </form>

        <aside className="admin-section">
          <h2>스캔 결과</h2>
          <div className="admin-stack">
            <div className="admin-field-readonly">
              <strong>목차</strong>
              {headings.length > 0 ? (
                headings.map((heading) => (
                  <span key={heading.id}>
                    {heading.text}
                  </span>
                ))
              ) : (
                <span>heading이 아직 없습니다.</span>
              )}
            </div>
            <div className="admin-field-readonly">
              <strong>본문 블록</strong>
              <span>{blocks.length}개 블록으로 변환됩니다.</span>
            </div>
            <div className="admin-field-readonly">
              <strong>공개 URL</strong>
              <Link href={`/guides/${slug}`}>
                /guides/{slug}
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
