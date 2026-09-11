import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CommunityPage() {
  return (
    <main className="page coming-soon-page coming-soon-page--forest">
      <section className="coming-soon-hero" aria-labelledby="community-title">
        <div className="coming-soon-copy">
          <span className="coming-soon-kicker">KSAN COMMUNITY</span>
          <h1 className="coming-soon-title" id="community-title">
            케이<span>숲</span>
          </h1>
          <p className="coming-soon-lead">
            학교, 도시, 전공이 달라도 편하게 묻고 나눌 수 있는 KSAN만의 커뮤니티를 만들고 있어요.
          </p>
          <div className="coming-soon-actions">
            <Link className="coming-soon-primary coming-soon-primary--forest" href="/auth">
              오픈 알림 받기
              <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
        </div>
      </section>
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
