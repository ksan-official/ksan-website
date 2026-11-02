import { LocalActivityBoard } from "@/components/LocalActivityBoard";
import { FeatureHero } from "@/components/FeatureHero";
import { isLocalDesignMode } from "@/lib/design-preview";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./CommunityPage.module.css";

export default function CommunityPage() {
  if (isLocalDesignMode) return <main id="main" className={styles.boardPage}>
    <FeatureHero kind="community" eyebrow="케이숲" titleId="community-title"
      title={<>편하게 묻고,<br />함께 나누는 이야기.</>} description="네덜란드 생활의 궁금한 것부터 소소한 일상까지." />
    <div className={styles.boardContent}><LocalActivityBoard kind="community" hasPageHero /></div>
  </main>;
  return (
    <main id="main" className={`page coming-soon-page coming-soon-page--forest ${styles.previewPage}`}>
      <FeatureHero kind="community" eyebrow="케이숲" titleId="community-title"
        title={<>편하게 묻고,<br />함께 나누는 이야기.</>} description="학교, 도시, 전공이 달라도 편하게 묻고 나눌 수 있는 KSAN만의 커뮤니티를 만들고 있어요.">
        <Link className="coming-soon-primary" href="/auth">오픈 알림 받기<ArrowRight aria-hidden size={18} /></Link>
      </FeatureHero>
      <section className="community-preview-section" aria-label="케이숲 화면 목업">
        <span className="community-preview-small-label">Preview</span>
        <div className="community-preview-images" aria-label="케이숲 화면 목업">
          <figure className="community-preview-image community-preview-image--wide">
            <Image
              alt="케이숲 게시판 목록 화면 목업"
              height={1194}
              sizes="(max-width: 900px) 100vw, 1280px"
              src="/images/community-preview/board.png"
              width={2172}
            />
          </figure>
          <div className="community-preview-image-grid">
            <figure className="community-preview-image">
              <Image
                alt="케이숲 게시글 본문 화면 목업"
                height={1132}
                sizes="(max-width: 900px) 100vw, 50vw"
                src="/images/community-preview/post.png"
                width={1202}
              />
            </figure>
            <figure className="community-preview-image">
              <Image
                alt="케이숲 댓글 화면 목업"
                height={1258}
                sizes="(max-width: 900px) 100vw, 50vw"
                src="/images/community-preview/comments.png"
                width={1244}
              />
            </figure>
          </div>
        </div>
      </section>
    </main>
  );
}
