import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { GuideArticleSidebar, type GuideHeading } from "@/components/GuideArticleSidebar";
import { GuideCategoryIcon } from "@/components/GuideCategoryIcon";
import { GuideNotionContent, guideHeadingId } from "@/components/GuideNotionContent";
import { getGuideBySlug } from "@/lib/guides";
import { resolveGuideCategory } from "@/lib/guide-structure";
import { buildGuideTocHeadings } from "@/lib/guideToc";

export const dynamic = "force-dynamic";

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuideBySlug(decodeURIComponent(slug));

  if (!guide) {
    notFound();
  }

  const headings: GuideHeading[] = buildGuideTocHeadings(guide.blocks, guideHeadingId);
  const category = resolveGuideCategory(guide.categoryId ?? guide.category);

  return (
    <main className="page article-layout guide-article-page" id="main">
      <article className="guide-article-main">
        <Link className="guide-breadcrumb" href="/guides">홈 / 정착가이드 / {guide.category}</Link>
        <header className="guide-article-header">
          <div className="guide-article-category-row">
            <span className="guide-article-category"><GuideCategoryIcon name={category.emoji} size={16} />{guide.category}</span>
          </div>
          <h1 className="page-title">{guide.title}</h1>
          {guide.tags.length ? (
            <div className="guide-article-tag-row">
              {guide.tags.map((tag) => <span className="guide-article-tag" key={tag}>#{tag}</span>)}
            </div>
          ) : null}
          <p className="guide-article-meta">업데이트 {guide.updatedAt}</p>
        </header>

        <div className="article-body"><GuideNotionContent blocks={guide.blocks} /></div>

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
        ) : (
          <section className="guide-end-card">
            <p>정착가이드</p>
            <h2>필요한 정보를 더 찾아보세요</h2>
            <div>
              <Link href={`/guides/category/${guide.categoryId}`}>
                같은 카테고리 보기 <ArrowUpRight aria-hidden size={17} />
              </Link>
              <Link href="/guides">
                정착가이드 목록 <ArrowUpRight aria-hidden size={17} />
              </Link>
            </div>
          </section>
        )}
      </article>
      <GuideArticleSidebar headings={headings} slug={guide.slug} />
    </main>
  );
}
