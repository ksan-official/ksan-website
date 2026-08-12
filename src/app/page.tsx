import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AmsterdamSpotMap } from "@/components/AmsterdamSpotMap";
import { HomeMotion } from "@/components/HomeMotion";
import { comingSoonSections } from "@/lib/content";

const placeholderSections = [
  {
    label: "정착가이드",
    title: "네덜란드 생활을 시작하는 법",
    description: "BSN, 은행, 보험, 비자, 집 구하기 등 핵심 가이드가 들어갈 자리입니다.",
    href: "/guides"
  },
  {
    label: "비즈니스 허브",
    title: "학생과 기업을 잇는 기회",
    description: "채용, 인턴십, 파트너십, 기업 소식이 들어갈 자리입니다.",
    href: "/business"
  },
  {
    label: "행사",
    title: "같은 곳에 있는 사람들을 만나는 자리",
    description: "오리엔테이션, 네트워킹, 세미나, 커뮤니티 이벤트가 들어갈 자리입니다.",
    href: "/events"
  },
  {
    label: "소개",
    title: "KSAN이 만드는 연결",
    description: "운영진, 팀, 후원사, 파트너 소개가 들어갈 자리입니다.",
    href: "/about"
  }
];

const placeholderFeed = [
  {
    label: "Coming soon",
    title: "첫 오리엔테이션 행사",
    description: "행사 일정과 신청 링크가 준비되면 여기에 표시됩니다."
  },
  {
    label: "Coming soon",
    title: "정착가이드 업데이트",
    description: "새로 작성된 가이드가 준비되면 여기에 표시됩니다."
  },
  {
    label: "Coming soon",
    title: "기업 공고",
    description: "등록된 공고가 생기면 여기에 표시됩니다."
  }
];

export default function HomePage() {
  return (
    <main className="page home-page" data-home-page id="main">
      <HomeMotion />
      <section className="hero-panel">
        <div aria-hidden className="hero-art" data-hero-art />
        <div data-hero-copy>
          <p className="eyebrow">Korean students in the Netherlands</p>
          <h1 className="page-title max-w-6xl">네덜란드 한인 학생 커뮤니티의 연결점</h1>
          <p className="lead" data-scrub-copy>
            KSAN은 네덜란드에서 공부하고 살아가는 한국 학생들이 정보, 사람, 행사, 기업 기회를
            한곳에서 만날 수 있도록 돕는 커뮤니티 허브입니다.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/guides">
              둘러보기 <ArrowRight size={18} aria-hidden />
            </Link>
            <Link className="button secondary" href="/mypage">
              마이페이지
            </Link>
          </div>
        </div>
        <aside className="ops-board" aria-label="Homepage placeholders" data-hero-board>
          {placeholderFeed.map((item) => (
            <div className="flow-step" key={item.title}>
              <span className="badge pending">{item.label}</span>
              <strong>{item.title}</strong>
              <span className="muted">{item.description}</span>
            </div>
          ))}
        </aside>
      </section>

      <section className="section" data-motion-section>
        <div className="section-header">
          <h2>주요 섹션</h2>
        </div>
        <div className="grid">
          {placeholderSections.map((item) => (
            <Link className="card interactive" data-motion-card href={item.href} key={item.title}>
              <span className="label">{item.label}</span>
              <strong>{item.title}</strong>
              <span className="muted">{item.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" data-motion-section>
        <div className="section-header">
          <h2>다음에 열릴 커뮤니티 기능</h2>
        </div>
        <div className="grid compact-grid">
          {comingSoonSections.map((section) => (
            <section className="card" data-motion-card key={section.title}>
              <span className="badge pending">준비 중</span>
              <h3>{section.title}</h3>
              <p className="muted">{section.description}</p>
            </section>
          ))}
        </div>
      </section>

      <AmsterdamSpotMap />
    </main>
  );
}
