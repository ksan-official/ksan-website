"use client";

import Image from "next/image";
import Link from "next/link";
import { PaletteTabs } from "@/components/PaletteTabs";
import { SiteNav } from "@/components/SiteNav";
import { GuideNotionContent, guideHeadingId } from "@/components/GuideNotionContent";
import { GuideArticleSidebar } from "@/components/GuideArticleSidebar";
import { buildGuideTocHeadings } from "@/lib/guideToc";
import type { GuideBlock } from "@/lib/types";

type AdminGuideWebsitePreviewProps = {
  blocks: GuideBlock[];
  categoryEmoji?: string;
  categoryTitle: string;
  tags: string[];
  headingIdPrefix?: string;
  title: string;
  updatedAt?: string;
};

export function AdminGuideWebsitePreview({
  blocks,
  categoryEmoji,
  categoryTitle,
  tags,
  headingIdPrefix = "",
  title,
  updatedAt
}: AdminGuideWebsitePreviewProps) {
  const headings = buildGuideTocHeadings(blocks, (block) => guideHeadingId(block, headingIdPrefix));
  const allowedHashes = new Set(headings.map((heading) => `#${heading.id}`));

  function shouldAllowPreviewTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return true;
    const link = target.closest("a");
    if (link) return allowedHashes.has(link.getAttribute("href") ?? "");

    const button = target.closest("button");
    return !button || button.classList.contains("guide-toc-toggle");
  }

  function keepPreviewClickInPlace(event: React.MouseEvent<HTMLDivElement>) {
    if (shouldAllowPreviewTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function keepPreviewKeyInPlace(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (shouldAllowPreviewTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function keepPreviewInPlace(event: React.MouseEvent<HTMLDivElement>) {
    const link = (event.target as HTMLElement).closest("a");
    if (link) {
      const href = link.getAttribute("href") ?? "";
      if (allowedHashes.has(href)) return;

      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.classList.contains("guide-toc-toggle")) return;
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div
      className="shell admin-website-preview-shell"
      onAuxClickCapture={keepPreviewInPlace}
      onClickCapture={keepPreviewClickInPlace}
      onKeyDownCapture={keepPreviewKeyInPlace}
    >
      <header className="site-header">
        <Link aria-label="KSAN 홈" className="brand brand-logo" href="/">
          <Image
            alt="KSAN 네덜란드 한인 학생회"
            height={584}
            priority
            src="/images/ksan-logo-black.png"
            width={1809}
          />
        </Link>
        <SiteNav />
        <PaletteTabs />
      </header>

      <main className="page guide-article-page admin-guide-preview-page" id="main">
        <article className="guide-article-main">
          <Link className="guide-breadcrumb" href="/guides">홈 / 정착가이드 / {categoryTitle}</Link>
          <header className="guide-article-header">
            <div className="guide-article-category-row">
              <span className="guide-article-category">
                {categoryEmoji ? <i aria-hidden>{categoryEmoji}</i> : null}
                {categoryTitle}
              </span>
            </div>
            <h1 className="page-title">{title || "제목 없음"}</h1>
            {tags.length ? (
              <div className="guide-article-tag-row">
                {tags.map((tag) => <span className="guide-article-tag" key={tag}>#{tag.replace(/^#/, "")}</span>)}
              </div>
            ) : null}
            {updatedAt ? <p className="guide-article-meta">업데이트 {updatedAt}</p> : null}
          </header>

          <div className="article-body">
            {blocks.length ? <GuideNotionContent blocks={blocks} headingIdPrefix={headingIdPrefix} /> : <p>본문이 아직 없습니다.</p>}
          </div>
        </article>

        <GuideArticleSidebar headings={headings} showSave={false} slug="admin-preview" />
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-identity">
            <Link aria-label="KSAN 홈" className="brand brand-logo compact" href="/">
              <Image
                alt="KSAN 네덜란드 한인 학생회"
                height={584}
                src="/images/ksan-logo-black.png"
                width={1809}
              />
            </Link>
          </div>
          <nav aria-label="하단 주요 메뉴" className="footer-sitemap">
            <span className="footer-label">Navigation</span>
            <Link href="/guides">정착가이드</Link>
            <Link href="/business">커리어 허브</Link>
            <Link href="/events">행사</Link>
            <Link href="/pass-it-on">중고거래</Link>
            <Link href="/community">케이숲</Link>
            <Link href="/about">소개</Link>
          </nav>
          <div className="footer-account">
            <span className="footer-label">My KSAN</span>
            <Link href="/mypage">마이페이지</Link>
          </div>
        </div>
        <div className="footer-meta">
          <span>© 2026 KSAN</span>
          <span>KSAN · Korean Students Association in the Netherlands</span>
        </div>
      </footer>
    </div>
  );
}
