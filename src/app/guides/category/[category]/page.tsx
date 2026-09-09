import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  getGuideCategory,
  guideCategories,
  guidePriorityLabels,
  resolveGuideCategory,
  type GuideTreeItem
} from "@/lib/guide-structure";
import { listGuides } from "@/lib/guides";
import type { GuideSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s·/&()\-]/g, "");
}

function findPublishedGuide(item: GuideTreeItem, guides: GuideSummary[]) {
  const itemTitle = normalize(item.title);
  const itemTerms = item.title
    .split(/[·/&()]/)
    .map(normalize)
    .filter((term) => term.length >= 3);

  return guides.find((guide) => {
    const guideTitle = normalize(guide.title);
    return (
      guideTitle === itemTitle ||
      guideTitle.includes(itemTitle) ||
      itemTitle.includes(guideTitle) ||
      itemTerms.some((term) => guideTitle.includes(term))
    );
  });
}

function displayTags(tags: string[]) {
  return tags.map((tag) => `#${tag.replace(/^#+/, "")}`);
}

export function generateStaticParams() {
  return guideCategories.map((category) => ({ category: category.id }));
}

export default async function GuideCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryId } = await params;
  const category = getGuideCategory(categoryId);

  if (!category) {
    notFound();
  }

  const guides = await listGuides();
  const categoryGuides = guides.filter(
    (guide) => resolveGuideCategory(guide.categoryId ?? guide.category).id === category.id
  );
  const matchedGuideIds = new Set(
    category.items.map((item) => findPublishedGuide(item, categoryGuides)?.id).filter(Boolean)
  );
  const additionalGuides = categoryGuides.filter((guide) => !matchedGuideIds.has(guide.id));
  const categoryIndex = guideCategories.findIndex((item) => item.id === category.id);
  const previousCategory = guideCategories[(categoryIndex - 1 + guideCategories.length) % guideCategories.length];
  const nextCategory = guideCategories[(categoryIndex + 1) % guideCategories.length];

  return (
    <main className="guide-category-page" id="main">
      <section className="guide-category-hero">
        <Link className="guide-category-back" href="/guides#guide-library">
          <ArrowLeft aria-hidden size={18} /> 전체 가이드
        </Link>
        <div className="guide-category-hero-copy">
          <span aria-hidden>{category.emoji}</span>
          <div>
            <p>KSAN Settlement Guide</p>
            <h1>{category.title}</h1>
            <strong>{category.description}</strong>
          </div>
        </div>
        <p className="guide-category-summary">
          {categoryGuides.length ? `${categoryGuides.length}개의 공개된 가이드에서 필요한 항목을 골라 확인하세요.` : "이 카테고리는 지금 업데이트 중입니다."}
          {" "}
          관리자페이지에서 공개로 저장한 글만 표시됩니다.
        </p>
      </section>

      <section className="guide-category-topics">
        <header>
          <p>{category.title} 세부 가이드</p>
          <h2>필요한 내용을 선택하세요.</h2>
        </header>
        <div className="guide-category-topic-list">
          {categoryGuides.length ? null : (
            <div className="guides-empty-state guides-empty-state--category">
              <strong>아직 공개된 가이드가 없습니다.</strong>
              <p>새 글을 준비 중입니다. 관리자페이지에서 공개로 저장하면 이 카테고리에 표시됩니다.</p>
            </div>
          )}
          {category.items.flatMap((item) => {
            const publishedGuide = findPublishedGuide(item, categoryGuides);
            if (!publishedGuide) return [];
            const tags = displayTags(publishedGuide.tags);
            const content = (
              <>
                <div className="guide-category-topic-title">
                  <span>{guidePriorityLabels[item.priority]}</span>
                  <h3>{item.title}</h3>
                </div>
                {tags.length ? (
                  <div className="guide-category-topic-index">
                    {tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                ) : <div />}
                <div className="guide-category-topic-action">
                  가이드 열기 <ArrowRight aria-hidden size={18} />
                </div>
              </>
            );

            return [
              <Link className="guide-category-topic" href={`/guides/${publishedGuide.slug}`} key={item.title}>
                {content}
              </Link>
            ];
          })}
          {additionalGuides.map((guide) => (
            <Link className="guide-category-topic" href={`/guides/${guide.slug}`} key={guide.id}>
              <div className="guide-category-topic-title">
                <span>새 가이드</span>
                <h3>{guide.title}</h3>
              </div>
              {guide.tags.length ? (
                <div className="guide-category-topic-index">
                  {displayTags(guide.tags).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              ) : <div />}
              <div className="guide-category-topic-action">가이드 열기 <ArrowRight aria-hidden size={18} /></div>
            </Link>
          ))}
        </div>
      </section>

      <nav aria-label="다른 가이드 주제" className="guide-category-pagination">
        <Link href={`/guides/category/${previousCategory.id}`}>
          <ArrowLeft aria-hidden size={18} />
          <span><small>이전 주제</small>{previousCategory.title}</span>
        </Link>
        <Link href={`/guides/category/${nextCategory.id}`}>
          <span><small>다음 주제</small>{nextCategory.title}</span>
          <ArrowRight aria-hidden size={18} />
        </Link>
      </nav>
    </main>
  );
}
