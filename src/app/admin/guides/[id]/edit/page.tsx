"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { deriveSummary, parseGuideText, slugFromTitle } from "@/lib/guideParser";

type EditableGuide = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  author: string | null;
  tags: string[] | null;
  raw_text: string;
  published: boolean;
};

export default function EditGuidePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [status, setStatus] = useState("가이드를 불러오는 중입니다.");
  const [guide, setGuide] = useState<EditableGuide | null>(null);
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [category, setCategory] = useState("정착가이드");
  const [summary, setSummary] = useState("");
  const [author, setAuthor] = useState("KSAN");
  const [tags, setTags] = useState("");
  const blocks = useMemo(() => parseGuideText(rawText), [rawText]);
  const headings = blocks.filter((block) => block.type.startsWith("heading"));

  const request = useCallback(async (path = "", options: RequestInit = {}) => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return fetch(`/api/admin/guides${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` }
    });
  }, []);

  useEffect(() => {
    async function loadGuide() {
      try {
        const response = await request();
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        const match = (result.guides as EditableGuide[]).find((item) => item.id === params.id) ?? null;
        if (!match) throw new Error("가이드를 찾지 못했습니다.");
        setGuide(match);
        setRawText(match.raw_text);
        setTitle(match.title);
        setSlug(match.slug);
        setCategory(match.category);
        setSummary(match.summary ?? "");
        setAuthor(match.author ?? "KSAN");
        setTags((match.tags ?? []).join(", "));
        setStatus("");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "가이드를 불러오지 못했습니다.");
      }
    }

    void loadGuide();
  }, [params.id, request]);

  function scanContent() {
    const firstHeading = blocks.find((block) => block.type === "heading_1" || block.type === "heading_2");
    const nextTitle = firstHeading?.text ?? title;
    setTitle(nextTitle);
    setSlug(slugFromTitle(nextTitle));
    setSummary(deriveSummary(rawText));
    setStatus("본문을 스캔해서 제목, slug, 요약, 목차를 갱신했습니다.");
  }

  async function importNotion() {
    const response = await request("/import-notion", {
      body: JSON.stringify({ url: notionUrl }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
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
    setStatus("Notion 페이지를 불러왔습니다. 확인 후 저장해주세요.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guide) return;

    const response = await request("", {
      body: JSON.stringify({
        id: guide.id,
        title,
        slug,
        summary,
        rawText,
        category,
        author,
        tags,
        published: new FormData(event.currentTarget).get("published") === "on"
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH"
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(`저장 실패: ${result.error}`);
      return;
    }
    setStatus("가이드를 저장했습니다.");
    router.refresh();
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">정착가이드</p>
          <h1>가이드 수정</h1>
          <p>Notion 링크로 다시 불러오거나 본문과 공개 상태를 수정합니다.</p>
        </div>
        <Link className="admin-button secondary" href="/admin/guides">
          목록으로
        </Link>
      </header>

      {guide ? (
        <section className="admin-editor-layout">
          <form className="admin-form" onSubmit={submit}>
            <label className="field">
              <span>Notion 링크</span>
              <input value={notionUrl} onChange={(event) => setNotionUrl(event.target.value)} placeholder="https://www.notion.so/..." />
            </label>
            <button className="admin-button secondary" type="button" onClick={importNotion}>
              Notion에서 불러오기
            </button>
            <label className="field">
              <span>본문</span>
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
            <label className="admin-check">
              <input name="published" type="checkbox" defaultChecked={guide.published} /> 공개
            </label>
            <button className="admin-button" type="submit">
              저장
            </button>
          </form>

          <aside className="admin-section">
            <h2>스캔 결과</h2>
            <div className="admin-stack">
              <div className="admin-field-readonly">
                <strong>목차</strong>
                {headings.length > 0 ? headings.map((heading) => <span key={heading.id}>{heading.text}</span>) : <span>heading이 아직 없습니다.</span>}
              </div>
              <div className="admin-field-readonly">
                <strong>본문 블록</strong>
                <span>{blocks.length}개 블록으로 변환됩니다.</span>
              </div>
              <div className="admin-field-readonly">
                <strong>공개 URL</strong>
                <Link href={`/guides/${slug}`}>/guides/{slug}</Link>
              </div>
            </div>
          </aside>
        </section>
      ) : null}
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
