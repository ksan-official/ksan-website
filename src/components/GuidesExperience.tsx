"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  KeyRound,
  Landmark,
  Plane,
  Search
} from "lucide-react";
import {
  guideCategories,
  guidePriorityLabels,
  resolveGuideCategory,
  settlementStages,
  type GuideCategory,
  type GuideTreeItem
} from "@/lib/guide-structure";
import type { GuideSummary } from "@/lib/types";

type GuidesExperienceProps = {
  guides: GuideSummary[];
  initialQuery?: string;
};

const roadmapIcons = [Plane, KeyRound, Landmark, HeartHandshake];

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s·/&()\-]/g, "");
}

function categorySearchText(category: GuideCategory) {
  return [
    category.title,
    category.description,
    ...category.items.flatMap((item) => [item.title, ...item.topics])
  ]
    .join(" ")
    .toLowerCase();
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

export function GuidesExperience({ guides, initialQuery = "" }: GuidesExperienceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("residency");
  const normalizedQuery = query.trim().toLowerCase();

  const visibleCategories = useMemo(
    () =>
      normalizedQuery
        ? guideCategories.filter((category) => categorySearchText(category).includes(normalizedQuery))
        : guideCategories,
    [normalizedQuery]
  );

  const selectedCategory =
    visibleCategories.find((category) => category.id === activeCategory) ?? visibleCategories[0];
  const selectedCategoryGuides = selectedCategory
    ? guides.filter((guide) => resolveGuideCategory(guide.categoryId ?? guide.category).id === selectedCategory.id)
    : [];
  const matchedGuideIds = new Set(
    selectedCategory?.items
      .map((item) => findPublishedGuide(item, selectedCategoryGuides)?.id)
      .filter(Boolean) ?? []
  );
  const additionalGuides = selectedCategoryGuides.filter((guide) => !matchedGuideIds.has(guide.id));

  return (
    <main className="guides-page guides-page--reference" id="main">
      <section className="guides-hero guides-help-hero">
        <div className="guides-help-search">
          <p className="guides-kicker"><span /> KSAN Settlement Guide</p>
          <h1>네덜란드 생활,<br />무엇이 궁금한가요?</h1>
          <p>도착 전 준비부터 주거, 행정, 금융과 일상까지 필요한 정보를 바로 찾아보세요.</p>
          <form
            className="guides-help-search-form"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("guide-browser")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Search aria-hidden size={22} />
            <label className="sr-only" htmlFor="guides-main-search">정착 가이드 검색</label>
            <input
              id="guides-main-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="BSN, 집 구하기, 건강보험처럼 검색해보세요"
              type="search"
              value={query}
            />
            <button type="submit">
              검색 <ArrowRight aria-hidden size={17} />
            </button>
          </form>
          <div className="guides-popular-searches">
            <strong>많이 찾는 검색어</strong>
            {["BSN", "집 구하기", "건강보험", "DigiD"].map((term) => (
              <button key={term} onClick={() => setQuery(term)} type="button">
                {term}
              </button>
            ))}
          </div>
        </div>

        <aside aria-label="인기 정착 가이드" className="guides-popular-panel">
          <header>
            <div>
              <span>Popular guides</span>
              <h2>지금 많이 찾는 가이드</h2>
            </div>
            <strong>03</strong>
          </header>
          <div className="guides-popular-list">
            {guides.slice(0, 3).map((guide, index) => (
              <Link href={`/guides/${guide.slug}`} key={guide.id}>
                <span className="guides-popular-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{guide.category}</small>
                  <strong>{guide.title}</strong>
                  <p>{guide.summary}</p>
                </div>
                <ArrowRight aria-hidden size={18} />
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="guides-start-strip" id="settlement-path">
        <header>
          <div>
            <p>처음 정착하기</p>
            <h2>네덜란드 도착 후,<br />이 순서대로 시작하세요.</h2>
          </div>
          <Link href="/guides/category/start">
            전체 체크리스트 <ArrowRight aria-hidden size={17} />
          </Link>
        </header>

        <div className="guides-start-track">
          {settlementStages.map((stage, index) => {
            const Icon = roadmapIcons[index];
            return (
              <Link href={`/guides/category/start#${stage.id}`} key={stage.id}>
                <span className="guides-start-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="guides-start-icon"><Icon aria-hidden size={18} /></span>
                <div>
                  <strong>{stage.title}</strong>
                  <small>{stage.tasks[0]}</small>
                </div>
                <ArrowRight aria-hidden className="guides-start-arrow" size={18} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="guides-browser" id="guide-browser">
        <header className="guides-browser-intro">
          <div>
            <p>세부 가이드</p>
            <h2>필요한 주제부터<br />바로 찾아보세요.</h2>
          </div>
          <p>카테고리를 고르면 관련 세부 가이드만 아래 목록에 표시됩니다.</p>
        </header>

        <label className="guides-search guides-browser-search">
          <Search aria-hidden size={20} />
          <span className="sr-only">가이드 검색</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="BSN, 집 구하기, 건강보험처럼 검색해보세요"
            type="search"
            value={query}
          />
          {query ? <button onClick={() => setQuery("")} type="button">지우기</button> : null}
        </label>

        <div aria-label="정착 가이드 카테고리" className="guides-topic-tabs" role="tablist">
          {visibleCategories.map((category) => (
            <button
              aria-selected={selectedCategory?.id === category.id}
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              role="tab"
              type="button"
            >
              <span aria-hidden>{category.emoji}</span>
              {category.title}
            </button>
          ))}
        </div>

        {selectedCategory ? (
          <section className="guides-reference-category" role="tabpanel">
            <div className="guides-reference-list">
              {selectedCategory.items.map((item, index) => {
                const publishedGuide = findPublishedGuide(item, selectedCategoryGuides);
                const content = (
                  <>
                    <span className="guides-reference-number">{String(index + 1).padStart(2, "0")}</span>
                    <div className="guides-reference-copy">
                      <span>{guidePriorityLabels[item.priority]}</span>
                      <h3>{item.title}</h3>
                      <p>{item.topics.join(" · ")}</p>
                      <small>
                        {publishedGuide
                          ? `${publishedGuide.updatedAt} · ${publishedGuide.author}`
                          : "KSAN 콘텐츠 준비 중"}
                      </small>
                    </div>
                    <span className="guides-reference-action">
                      {publishedGuide ? "열기" : "준비 중"}
                      {publishedGuide ? <ArrowRight aria-hidden size={18} /> : null}
                    </span>
                  </>
                );

                return publishedGuide ? (
                  <Link className="guides-reference-row" href={`/guides/${publishedGuide.slug}`} key={item.title}>
                    {content}
                  </Link>
                ) : (
                  <div className="guides-reference-row is-pending" key={item.title}>{content}</div>
                );
              })}
              {additionalGuides.map((guide, index) => (
                <Link className="guides-reference-row" href={`/guides/${guide.slug}`} key={guide.id}>
                  <span className="guides-reference-number">
                    {String(selectedCategory.items.length + index + 1).padStart(2, "0")}
                  </span>
                  <div className="guides-reference-copy">
                    <span>새 가이드</span>
                    <h3>{guide.title}</h3>
                    <p>{guide.tags.length ? guide.tags.join(" · ") : guide.summary}</p>
                    <small>{guide.updatedAt} · {guide.author}</small>
                  </div>
                  <span className="guides-reference-action">열기 <ArrowRight aria-hidden size={18} /></span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="guides-no-result">
            <strong>일치하는 주제를 찾지 못했어요.</strong>
            <p>검색어를 조금 더 짧게 바꿔보세요.</p>
          </div>
        )}
      </section>
    </main>
  );
}
