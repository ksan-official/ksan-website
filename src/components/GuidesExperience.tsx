"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search
} from "lucide-react";
import {
  guideCategories,
  guidePriorityLabels,
  resolveGuideCategory,
  type GuideCategory,
  type GuideTreeItem
} from "@/lib/guide-structure";
import type { GuideSummary } from "@/lib/types";
import { AmsterdamSpotMap } from "@/components/AmsterdamSpotMap";

type GuidesExperienceProps = {
  guides: GuideSummary[];
  initialQuery?: string;
};

const spotGuideCategory: GuideCategory = {
  id: "spots",
  title: "네덜란드 스팟",
  emoji: "📍",
  description: "카페, 맛집, 공부 스팟을 지도에서 찾아봐요.",
  items: []
};

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

function displayTags(tags: string[]) {
  return tags.map((tag) => `#${tag.replace(/^#+/, "")}`);
}

export function GuidesExperience({ guides, initialQuery = "" }: GuidesExperienceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(
    () => guides[0] ? resolveGuideCategory(guides[0].categoryId ?? guides[0].category).id : "start"
  );
  const normalizedQuery = query.trim().toLowerCase();

  const guideBrowserCategories = useMemo(() => [...guideCategories, spotGuideCategory], []);
  const visibleCategories = useMemo(
    () =>
      normalizedQuery
        ? guideBrowserCategories.filter((category) => categorySearchText(category).includes(normalizedQuery))
        : guideBrowserCategories,
    [guideBrowserCategories, normalizedQuery]
  );

  const selectedCategory =
    visibleCategories.find((category) => category.id === activeCategory) ?? visibleCategories[0];
  const searchedGuides = normalizedQuery
    ? guides.filter((guide) =>
        [guide.title, guide.category, guide.summary, guide.author, ...guide.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : guides;
  const selectedCategoryGuides = selectedCategory
    ? searchedGuides.filter((guide) => resolveGuideCategory(guide.categoryId ?? guide.category).id === selectedCategory.id)
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
        </div>

        <aside aria-label="인기 정착 가이드" className="guides-popular-panel">
          <header>
            <div>
              <span>Popular guides</span>
              <h2>지금 많이 찾는 가이드</h2>
            </div>
          </header>
          <div className="guides-popular-list">
            {guides.length ? (
              guides.slice(0, 3).map((guide) => {
                const tags = displayTags(guide.tags);
                return (
                  <Link href={`/guides/${guide.slug}`} key={guide.id}>
                    <div>
                      <small>{guide.category}</small>
                      <strong>{guide.title}</strong>
                      {tags.length ? <p>{tags.join(" ")}</p> : null}
                    </div>
                    <ArrowRight aria-hidden size={18} />
                  </Link>
                );
              })
            ) : (
              <div className="guides-empty-state">
                <strong>공개된 가이드가 없습니다.</strong>
                <p>관리자페이지에서 공개로 저장한 글만 여기에 표시됩니다.</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="guides-browser" id="guide-browser">
        <header className="guides-browser-intro">
          <div>
            <p>세부 가이드</p>
            <h2>필요한 주제부터<br />바로 찾아보세요.</h2>
          </div>
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
            {selectedCategory.id === "spots" ? (
              <AmsterdamSpotMap />
            ) : null}
            {selectedCategory.id !== "spots" ? (
              <div className="guides-reference-list">
                {selectedCategoryGuides.length ? null : (
                  <div className="guides-empty-state guides-empty-state--list">
                    <strong>아직 공개된 가이드가 없습니다.</strong>
                    <p>새 글을 준비 중입니다. 관리자페이지에서 공개로 저장하면 이곳에 표시됩니다.</p>
                  </div>
                )}
                {selectedCategory.items.flatMap((item) => {
                  const publishedGuide = findPublishedGuide(item, selectedCategoryGuides);
                  if (!publishedGuide) return [];
                  const tags = displayTags(publishedGuide.tags);
                  const content = (
                    <>
                      <div className="guides-reference-copy">
                        <span>{guidePriorityLabels[item.priority]}</span>
                        <h3>{item.title}</h3>
                        {tags.length ? <p>{tags.join(" ")}</p> : null}
                      </div>
                      <span className="guides-reference-action">
                        열기 <ArrowRight aria-hidden size={18} />
                      </span>
                    </>
                  );

                  return [
                    <Link className="guides-reference-row" href={`/guides/${publishedGuide.slug}`} key={item.title}>
                      {content}
                    </Link>
                  ];
                })}
                {additionalGuides.map((guide, index) => (
                  <Link className="guides-reference-row" href={`/guides/${guide.slug}`} key={guide.id}>
                    <div className="guides-reference-copy">
                      <span>{index === 0 ? "새 가이드" : "업데이트"}</span>
                      <h3>{guide.title}</h3>
                      {guide.tags.length ? <p>{displayTags(guide.tags).join(" ")}</p> : null}
                    </div>
                    <span className="guides-reference-action">열기 <ArrowRight aria-hidden size={18} /></span>
                  </Link>
                ))}
              </div>
            ) : null}
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
