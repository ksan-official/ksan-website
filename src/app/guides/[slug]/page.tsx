import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideSaveButton } from "@/components/GuideSaveButton";
import { getGuideBySlug } from "@/lib/guides";

function blockId(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "");
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const headings = guide.blocks.filter((block) => block.type.startsWith("heading"));

  return (
    <main className="page article-layout">
      <article>
        <p className="muted">홈 / 정착가이드 / {guide.category}</p>
        <p className="status">{guide.category}</p>
        <h1 className="page-title">{guide.title}</h1>
        <p className="muted">
          업데이트: {guide.updatedAt} · {guide.author}
        </p>
        <GuideSaveButton slug={guide.slug} />
        <div className="status">{guide.summary}</div>
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
            return <p key={block.id}>{block.text}</p>;
          })}
        </div>
      </article>
      <aside className="toc">
        <section className="card">
          <h2>목차</h2>
          {headings.map((heading) => (
            <p key={heading.id}>
              <a className="muted" href={`#${blockId(heading.text)}`}>
                {heading.text}
              </a>
            </p>
          ))}
        </section>
        <section className="card" style={{ marginTop: 16 }}>
          <h2>관련 가이드</h2>
          {guide.related.map((item) => (
            <p key={item.id}>
              <Link className="muted" href={`/guides/${item.slug}`}>
                {item.title}
              </Link>
            </p>
          ))}
        </section>
      </aside>
    </main>
  );
}
