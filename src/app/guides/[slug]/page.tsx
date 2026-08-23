import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { GuideArticleSidebar, type GuideHeading } from "@/components/GuideArticleSidebar";
import { getGuideBySlug } from "@/lib/guides";
import type { GuideBlock } from "@/lib/types";

function headingId(block: GuideBlock) {
  return `section-${block.id.replace(/[^a-zA-Z0-9가-힣_-]/g, "-")}`;
}

function headingLevel(block: GuideBlock): 1 | 2 | 3 {
  if (block.type === "heading_1") return 1;
  if (block.type === "heading_2") return 2;
  return 3;
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const headings: GuideHeading[] = guide.blocks
    .filter((block) => block.type.startsWith("heading"))
    .map((block) => ({ id: headingId(block), level: headingLevel(block), text: block.text }));

  return (
    <main className="page article-layout guide-article-page" id="main">
      <article className="guide-article-main">
        <Link className="guide-breadcrumb" href="/guides">홈 / 정착가이드 / {guide.category}</Link>
        <header className="guide-article-header">
          <div className="guide-article-tags">
            <span className="guide-article-category"><i aria-hidden>🏛️</i>{guide.category}</span>
            {guide.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
          <h1 className="page-title">{guide.title}</h1>
          <p className="guide-article-summary">{guide.summary}</p>
          <p className="guide-article-meta">업데이트 {guide.updatedAt} · {guide.author}</p>
        </header>

        <div className="article-body">
          {guide.blocks.map((block) => {
            if (block.type === "heading_1") {
              return (
                <h2 className="article-heading article-heading--1" id={headingId(block)} key={block.id}>
                  {block.text}
                </h2>
              );
            }
            if (block.type === "heading_2") {
              return (
                <h3 className="article-heading article-heading--2" id={headingId(block)} key={block.id}>
                  {block.text}
                </h3>
              );
            }
            if (block.type === "heading_3") {
              return <h4 className="article-heading article-heading--3" id={headingId(block)} key={block.id}>{block.text}</h4>;
            }
            if (block.type === "bulleted_list_item") {
              return <li key={block.id}>{block.text}</li>;
            }
            if (block.type === "numbered_list_item") {
              return <li key={block.id}>{block.text}</li>;
            }
            return <p key={block.id}>{block.text}</p>;
          })}
        </div>

        {guide.related.length ? (
          <section className="guide-related">
            <p>RELATED GUIDE</p>
            <h2>이어서 살펴보세요</h2>
            <div>
              {guide.related.map((item) => (
                <Link href={`/guides/${item.slug}`} key={item.id}>
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                  <ArrowUpRight aria-hidden size={18} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
      <GuideArticleSidebar headings={headings} slug={guide.slug} />
    </main>
  );
}
