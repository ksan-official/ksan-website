"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { deriveSummary, parseGuideText, slugFromTitle } from "@/lib/guideParser";
import type { GuideBlock } from "@/lib/types";

type HeadingBlock = Extract<GuideBlock, { text: string; type: "heading_1" | "heading_2" | "heading_3" }>;

function isHeadingBlock(block: GuideBlock): block is HeadingBlock {
  return block.type === "heading_1" || block.type === "heading_2" || block.type === "heading_3";
}

export default function NewGuidePage() {
  const [status, setStatus] = useState<string | null>(null);
  const [notionUrl, setNotionUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("정착가이드");
  const [summary, setSummary] = useState("");
  const [author, setAuthor] = useState("KSAN");
  const [tags, setTags] = useState("");
  const [importedBlocks, setImportedBlocks] = useState<GuideBlock[] | null>(null);
  const blocks = useMemo(() => parseGuideText(rawText), [rawText]);
  const effectiveBlockCount = importedBlocks?.length ?? blocks.length;
  const headings = blocks.filter(isHeadingBlock);

  function scanContent() {
    const firstHeading = blocks.filter(isHeadingBlock).find((block) => block.type === "heading_1" || block.type === "heading_2");
    const nextTitle = firstHeading?.text ?? title;
    setImportedBlocks(null);
    setTitle(nextTitle);
    setSlug(slugFromTitle(nextTitle));
    setSummary(deriveSummary(rawText));
    setStatus("본문을 스캔해서 제목, slug, 요약, 목차를 갱신했습니다.");
  }

  async function importNotion() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus("불러오기 실패: 관리자 계정으로 먼저 로그인해야 합니다.");
      return;
    }

    setStatus("Notion 페이지를 불러오는 중입니다.");
    const response = await fetch("/api/admin/guides/import-notion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({ url: notionUrl })
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(`불러오기 실패: ${result.error}`);
      return;
    }

    setRawText(result.rawText ?? "");
    setTitle(result.title ?? "");
    setSlug(result.slug ?? "");
    setCategory(result.category ?? "정착가이드");
    setSummary(result.summary ?? "");
    setAuthor(result.author ?? "KSAN");
    setTags((result.tags ?? []).join(", "));
    setImportedBlocks(Array.isArray(result.blocks) ? result.blocks : null);
    setStatus("Notion 페이지를 불러왔습니다. 확인 후 저장해주세요.");
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
        category,
        author,
        tags,
        blocks: importedBlocks ?? undefined,
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
          <h1>새 가이드 추가</h1>
          <p>Notion 링크로 불러오거나 본문을 직접 입력한 뒤 저장합니다.</p>
        </div>
        <Link className="admin-button secondary" href="/admin/guides">
          목록으로
        </Link>
      </header>

      <section className="admin-editor-layout">
        <form className="admin-form" onSubmit={submit}>
          <label className="field">
            <span>Notion 페이지 링크</span>
            <input
              value={notionUrl}
              onChange={(event) => setNotionUrl(event.target.value)}
              placeholder="표에서 가이드 제목을 클릭한 뒤 그 페이지 링크를 붙여넣기"
            />
          </label>
          <button className="admin-button secondary" type="button" onClick={importNotion}>
            Notion에서 불러오기
          </button>
          <label className="field">
            <span>본문 붙여넣기</span>
            <textarea
              value={rawText}
              onChange={(event) => {
                setRawText(event.target.value);
                setImportedBlocks(null);
              }}
              rows={14}
            />
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
            <input value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>
          <label className="field">
            <span>요약</span>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
          </label>
          <label className="field">
            <span>작성자</span>
            <input value={author} onChange={(event) => setAuthor(event.target.value)} />
          </label>
          <label className="field">
            <span>태그</span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} />
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
              <span>{effectiveBlockCount}개 블록으로 저장됩니다.</span>
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
