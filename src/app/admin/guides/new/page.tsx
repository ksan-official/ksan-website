"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { deriveSummary, parseGuideText, slugFromTitle } from "@/lib/guideParser";
import { guideCategories } from "@/lib/guide-structure";

export default function NewGuidePage() {
  const [status, setStatus] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [notionHeadings, setNotionHeadings] = useState<Array<{ id: string; text: string; type: string }>>([]);
  const [notionBlockCount, setNotionBlockCount] = useState(0);
  const [notionLoading, setNotionLoading] = useState(false);
  const blocks = useMemo(() => parseGuideText(rawText), [rawText]);
  const headings = blocks.filter((block) => block.type.startsWith("heading"));
  const previewHeadings = notionHeadings.length ? notionHeadings : headings;
  const previewBlockCount = notionBlockCount || blocks.length;

  function scanContent() {
    const firstHeading = blocks.find((block) => block.type === "heading_1" || block.type === "heading_2");
    const nextTitle = firstHeading?.text ?? title;
    setTitle(nextTitle);
    setSlug(slugFromTitle(nextTitle));
    setSummary(deriveSummary(rawText));
    setStatus("본문을 스캔해서 제목, slug, 요약, 목차를 갱신했습니다.");
  }

  async function scanNotion() {
    if (!notionUrl.trim()) {
      setStatus("Notion 링크를 먼저 입력해주세요.");
      return;
    }

    setNotionLoading(true);
    setStatus("Notion 문서를 불러오는 중입니다…");
    let supabase;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      setStatus("연결 설정이 없습니다. 로컬 .env.local에 Supabase 환경변수를 설정한 뒤 개발 서버를 다시 시작해주세요.");
      setNotionLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus("불러오기 실패: 관리자 계정으로 먼저 로그인해야 합니다.");
      setNotionLoading(false);
      return;
    }

    const response = await fetch("/api/admin/guides", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({ notionUrl })
    });
    const result = await response.json();
    if (response.ok) {
      setTitle(result.title);
      setSlug(slugFromTitle(result.title));
      setSummary(result.summary);
      setNotionHeadings(result.headings ?? []);
      setNotionBlockCount(result.blocks?.length ?? 0);
      setStatus(`Notion 연결 완료: ${result.blocks?.length ?? 0}개 블록을 확인했습니다.`);
    } else {
      setStatus(`불러오기 실패: ${result.error}`);
    }
    setNotionLoading(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let supabase;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      setStatus("저장 실패: 로컬 Supabase 환경변수가 없습니다. .env.local 설정 후 서버를 다시 시작해주세요.");
      return;
    }
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
        notionUrl,
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
          <p>Notion 링크를 연결하고 L2 카테고리를 고르면 KSAN 디자인으로 변환해 게시합니다.</p>
        </div>
        <Link className="admin-button secondary" href="/admin/guides">
          목록으로
        </Link>
      </header>

      <section className="admin-editor-layout">
        <form className="admin-form" onSubmit={submit}>
          <label className="field">
            <span>Notion 글 링크</span>
            <input
              onChange={(event) => setNotionUrl(event.target.value)}
              placeholder="https://www.notion.so/..."
              type="url"
              value={notionUrl}
            />
          </label>
          <button className="admin-button secondary" disabled={notionLoading} type="button" onClick={scanNotion}>
            {notionLoading ? "Notion 확인 중…" : "Notion 내용 불러오기"}
          </button>
          <p className="admin-form-note">페이지를 KSAN Notion Integration과 공유해야 내용을 불러올 수 있습니다.</p>
          <label className="field">
            <span>제목</span>
            <input placeholder="Notion에서 자동으로 불러옵니다" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="field">
            <span>Slug</span>
            <input placeholder="제목에서 자동 생성됩니다" value={slug} onChange={(event) => setSlug(event.target.value)} />
          </label>
          <label className="field">
            <span>L2 카테고리</span>
            <select defaultValue="residency" name="category">
              {guideCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.emoji} {category.title}</option>
              ))}
            </select>
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
            <input name="tags" placeholder="BSN, 행정, 정착" />
          </label>
          <label className="field admin-manual-content">
            <span>직접 작성 본문 (Notion을 사용하지 않을 때)</span>
            <textarea
              placeholder="# 제목\n\n## 소제목\n본문을 입력하세요."
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={10}
            />
          </label>
          {rawText ? (
            <button className="admin-button secondary" type="button" onClick={scanContent}>직접 작성 본문 스캔</button>
          ) : null}
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
              {previewHeadings.length > 0 ? (
                previewHeadings.map((heading) => (
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
              <span>{previewBlockCount}개 블록으로 변환됩니다.</span>
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
