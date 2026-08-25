import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  getGuideCategory,
  guideCategories,
  guidePriorityLabels,
  resolveGuideCategory,
  settlementStages,
  type GuideTreeItem
} from "@/lib/guide-structure";
import { listGuides } from "@/lib/guides";
import type { GuideSummary } from "@/lib/types";

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
          {category.items.length}개의 세부 가이드에서 필요한 항목을 골라 확인하세요.
          공개된 Notion 문서는 바로 열리고, 작성 중인 항목은 준비 상태로 표시됩니다.
        </p>
      </section>

      {category.id === "start" ? (
        <section className="guide-category-roadmap">
          <header>
            <p>정착 체크리스트</p>
            <h2>지금 내 시점부터 시작해도 괜찮아요.</h2>
          </header>
          <div>
            {settlementStages.map((stage) => (
              <article id={stage.id} key={stage.id}>
                <span>{stage.title}</span>
                <div>
                  <h3>{stage.title}에 챙길 것</h3>
                  <p>{stage.description}</p>
                  <ul>
                    {stage.tasks.map((task) => (
                      <li key={task}><Check aria-hidden size={16} />{task}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="guide-category-topics">
        <header>
          <p>{category.title} 세부 가이드</p>
          <h2>필요한 내용을 선택하세요.</h2>
        </header>
        <div className="guide-category-topic-list">
          {category.items.map((item) => {
            const publishedGuide = findPublishedGuide(item, categoryGuides);
            const content = (
              <>
                <div className="guide-category-topic-title">
                  <span>{guidePriorityLabels[item.priority]}</span>
                  <h3>{item.title}</h3>
                </div>
                <div className="guide-category-topic-index">
                  {item.topics.map((topic) => <span key={topic}>{topic}</span>)}
                </div>
                <div className="guide-category-topic-action">
                  {publishedGuide ? "가이드 열기" : "콘텐츠 준비 중"}
                  {publishedGuide ? <ArrowRight aria-hidden size={18} /> : null}
                </div>
              </>
            );

            return publishedGuide ? (
              <Link className="guide-category-topic" href={`/guides/${publishedGuide.slug}`} key={item.title}>
                {content}
              </Link>
            ) : (
              <div className="guide-category-topic is-pending" key={item.title}>{content}</div>
            );
          })}
          {additionalGuides.map((guide) => (
            <Link className="guide-category-topic" href={`/guides/${guide.slug}`} key={guide.id}>
              <div className="guide-category-topic-title">
                <span>새 가이드</span>
                <h3>{guide.title}</h3>
              </div>
              <div className="guide-category-topic-index">
                {(guide.tags.length ? guide.tags : [guide.summary]).filter(Boolean).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
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
