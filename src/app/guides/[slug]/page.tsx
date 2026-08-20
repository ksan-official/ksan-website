import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideSaveButton } from "@/components/GuideSaveButton";
import { getGuideBySlug } from "@/lib/guides";
import type { GuideBlock } from "@/lib/types";

type HeadingBlock = Extract<GuideBlock, { text: string; type: "heading_1" | "heading_2" | "heading_3" }>;
type PageHeading = { id: string; text: string };

function isHeadingBlock(block: GuideBlock): block is HeadingBlock {
  return block.type === "heading_1" || block.type === "heading_2" || block.type === "heading_3";
}

function blockId(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "");
}

function extractHtmlHeadings(html: string): PageHeading[] {
  return Array.from(normalizeStoredHtml(html).matchAll(/<h[23]\s+id="([^"]+)"[^>]*>(.*?)<\/h[23]>/g)).map((match) => ({
    id: match[1],
    text: match[2].replace(/<[^>]+>/g, "")
  }));
}

function normalizeStoredHtml(html: string) {
  return html
    .replaceAll("&amp;quot;", "&quot;")
    .replaceAll("&amp;#34;", "&#34;")
    .replaceAll("&amp;#39;", "&#39;")
    .replaceAll("&amp;apos;", "&apos;");
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const headings: PageHeading[] = guide.blocks.flatMap((block) => {
    if (isHeadingBlock(block)) return [{ id: blockId(block.text), text: block.text }];
    if (block.type === "html") return extractHtmlHeadings(block.html);
    return [];
  });
  const primaryHeading = headings[0]?.text;

  return (
    <main className="guide-detail-page">
      <div className="guide-detail-shell">
        <article className="guide-article">
        <nav className="guide-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">홈</Link>
          <span>/</span>
          <Link href="/guides">정착가이드</Link>
          <span>/</span>
          <span>{guide.category}</span>
        </nav>

        <div className="guide-category-pill">{guide.category}</div>
        <h1>{guide.title}</h1>
        <div className="guide-meta">
          <span>업데이트: {guide.updatedAt || "최근 수정"}</span>
          <span>{guide.author}</span>
        </div>
        <GuideSaveButton slug={guide.slug} />
        {guide.summary ? (
          <aside className="guide-summary">
            <strong>이 글은 이런 분께 도움이 됩니다</strong>
            <p>{guide.summary}</p>
          </aside>
        ) : null}

        <div className="article-body">
          {guide.blocks.map((block) => {
            if (block.type === "heading_1" || block.type === "heading_2") {
              return (
                <h2 id={blockId(block.text)} key={block.id}>
                  {block.text}
                </h2>
              );
            }
            if (block.type === "heading_3") {
              return (
                <h3 id={blockId(block.text)} key={block.id}>
                  {block.text}
                </h3>
              );
            }
            if (block.type === "bulleted_list_item") {
              return <li key={block.id}>{block.text}</li>;
            }
            if (block.type === "numbered_list_item") {
              return <li key={block.id}>{block.text}</li>;
            }
            if (block.type === "image") {
              return (
                <figure className="guide-media" key={block.id}>
                  <img alt={block.caption || "가이드 이미지"} src={block.url} />
                  {block.caption ? <figcaption>{block.caption}</figcaption> : null}
                </figure>
              );
            }
            if (block.type === "file") {
              return (
                <a className="guide-file-link" href={block.url} key={block.id} rel="noreferrer" target="_blank">
                  <span>첨부 파일</span>
                  <strong>{block.name}</strong>
                  {block.caption ? <small>{block.caption}</small> : null}
                </a>
              );
            }
            if (block.type === "table") {
              const [header, ...rows] = block.rows;
              const bodyRows = block.hasColumnHeader ? rows : block.rows;
              return (
                <div className="guide-table-wrap" key={block.id}>
                  <table className="guide-table">
                    {block.hasColumnHeader && header ? (
                      <thead>
                        <tr>{header.map((cell, index) => <th key={`${block.id}-head-${index}`}>{cell}</th>)}</tr>
                      </thead>
                    ) : null}
                    <tbody>
                      {bodyRows.map((row, rowIndex) => (
                        <tr key={`${block.id}-row-${rowIndex}`}>
                          {row.map((cell, cellIndex) =>
                            block.hasRowHeader && cellIndex === 0 ? (
                              <th key={`${block.id}-${rowIndex}-${cellIndex}`}>{cell}</th>
                            ) : (
                              <td key={`${block.id}-${rowIndex}-${cellIndex}`}>{cell}</td>
                            )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            if (block.type === "html") {
              return <div className="guide-notion-html" dangerouslySetInnerHTML={{ __html: normalizeStoredHtml(block.html) }} key={block.id} />;
            }
            return <p key={block.id}>{block.text}</p>;
          })}
        </div>
      </article>

      <aside className="guide-side-rail">
        <section className="guide-side-card">
          <h2>목차</h2>
          {headings.length ? headings.map((heading) => (
            <a className={heading.text === primaryHeading ? "active" : ""} key={heading.id} href={`#${heading.id}`}>
                {heading.text}
            </a>
          )) : <p className="muted">목차가 없습니다.</p>}
        </section>
        <section className="guide-side-card">
          <h2>관련 가이드</h2>
          {guide.related.length ? guide.related.map((item) => (
            <Link key={item.id} href={`/guides/${item.slug}`}>
                {item.title}
              </Link>
          )) : <p className="muted">관련 가이드가 없습니다.</p>}
        </section>
      </aside>
      </div>
    </main>
  );
}
