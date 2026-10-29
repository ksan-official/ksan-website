"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./GuidesExperience.module.css";
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
import { SettlementCategoryArt } from "@/components/SettlementCategoryArt";

type GuidesExperienceProps = {
  guides: GuideSummary[];
  initialQuery?: string;
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

function GuidePreviewContent({
  action = "열기",
  guide,
  label
}: {
  action?: string;
  guide: GuideSummary;
  label: string;
}) {
  return (
    <>
      <div className="guides-reference-copy">
        <span>{label}</span>
        <h3>{guide.title}</h3>
        {guide.tags.length ? <p>{displayTags(guide.tags).join(" ")}</p> : null}
        {guide.summary ? <small>{guide.summary}</small> : null}
      </div>
      <span className="guides-reference-action">
        {action} {!guide.isDemoLocked ? <ArrowRight aria-hidden size={18} /> : null}
      </span>
    </>
  );
}

export function GuidesExperience({ guides, initialQuery = "" }: GuidesExperienceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(
    () => guides[0] ? resolveGuideCategory(guides[0].categoryId ?? guides[0].category).id : "start"
  );
  const normalizedQuery = query.trim().toLowerCase();

  const guideBrowserCategories = useMemo(() => guideCategories, []);
  const visibleCategories = useMemo(
    () =>
      normalizedQuery
        ? guideBrowserCategories.filter((category) => categorySearchText(category).includes(normalizedQuery) || guides.some((guide) =>
            resolveGuideCategory(guide.categoryId ?? guide.category).id === category.id &&
            [guide.title, guide.category, guide.summary, guide.author, ...guide.tags].join(" ").toLowerCase().includes(normalizedQuery)
          ))
        : guideBrowserCategories,
    [guideBrowserCategories, guides, normalizedQuery]
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
    <main className={`guides-page guides-page--reference ${styles.page}`} id="main">
      <section className={styles.hero} aria-labelledby="settlement-title">
        <div className={styles.copy}>
          <p className={styles.kicker}>정착가이드</p>
          <h1 id="settlement-title">네덜란드 생활,<br />여기서부터.</h1>
          <p className={styles.description}>도착 전 준비부터 일상까지,<br />필요한 정보를 찾아보세요.</p>
          <form className={styles.search} role="search" onSubmit={(event) => {
            event.preventDefault();
            document.getElementById("guide-browser")?.scrollIntoView({ behavior: "instant", block: "start" });
          }}>
            <Search aria-hidden size={20} strokeWidth={1.6} />
            <label className="sr-only" htmlFor="settlement-search">가이드 검색</label>
            <input id="settlement-search" onChange={(event) => setQuery(event.target.value)} placeholder="BSN, 집 구하기, 건강보험 검색" type="search" value={query} />
            <button type="submit" aria-label="가이드 검색하기"><ArrowRight size={21} aria-hidden /></button>
          </form>
        </div>


      </section>

      <Link href="/spots" className={styles.spotEntry}>
        <div className={styles.spotIllustration}>
          <Image src="/images/netherlands-spots-illustration.png" alt="운하와 거리, 주황색 장소 핀이 있는 지도 일러스트" fill sizes="(max-width: 640px) 100vw, 320px" />
        </div>
        <div className={styles.spotCopy}>
          <h2>네덜란드 스팟</h2>
          <p>카페부터 공부하기 좋은 곳까지,<br className={styles.mobileBreak} /> 지도에서 찾아보세요.</p>
        </div>
        <span className={styles.spotAction}>지도 열기 <ArrowRight size={19} aria-hidden /></span>
      </Link>

      <section className="guides-browser" id="guide-browser">
        <header className="guides-browser-intro">
          <div>
            <p>세부 가이드</p>
            <h2>필요한 주제부터<br />바로 찾아보세요.</h2>
          </div>
        </header>

        {query && <div className={styles.searchResult}><p>“{query}” 검색 결과</p><button type="button" onClick={() => setQuery("")}>검색 지우기</button></div>}

        <div aria-label="정착 가이드 카테고리" className="guides-topic-tabs" role="tablist">
          {visibleCategories.map((category) => (
            <button
              aria-selected={selectedCategory?.id === category.id}
              data-category={category.id}
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              role="tab"
              type="button"
            >
              <span aria-hidden>
                <SettlementCategoryArt category={category.id} />
              </span>
              {category.title}
            </button>
          ))}
        </div>

        {selectedCategory ? (
          <section className="guides-reference-category" role="tabpanel">
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
                  const label = guidePriorityLabels[item.priority];
                  const content = (
                    <GuidePreviewContent
                      action={publishedGuide.isDemoLocked ? "준비 중" : "열기"}
                      guide={publishedGuide}
                      label={label}
                    />
                  );

                  return publishedGuide.isDemoLocked
                    ? [
                        <article className="guides-reference-row is-pending" key={item.title}>
                          {content}
                        </article>
                      ]
                    : [
                        <Link className="guides-reference-row" href={`/guides/${publishedGuide.slug}`} key={item.title}>
                          {content}
                        </Link>
                      ];
                })}
                {additionalGuides.map((guide, index) => {
                  const content = (
                    <GuidePreviewContent
                      action={guide.isDemoLocked ? "준비 중" : "열기"}
                      guide={guide}
                      label={index === 0 ? "새 가이드" : "업데이트"}
                    />
                  );

                  return guide.isDemoLocked ? (
                    <article className="guides-reference-row is-pending" key={guide.id}>
                      {content}
                    </article>
                  ) : (
                    <Link className="guides-reference-row" href={`/guides/${guide.slug}`} key={guide.id}>
                      {content}
                    </Link>
                  );
                })}
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
