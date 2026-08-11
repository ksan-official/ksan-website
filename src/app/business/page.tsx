import { Briefcase } from "lucide-react";
import Link from "next/link";
import { fallbackBusinessPosts } from "@/lib/content";

function applyHref(mode: string, target: string) {
  if (mode === "email") {
    return `mailto:${target}`;
  }
  return target;
}

export default function BusinessPage() {
  return (
    <main className="page" id="main">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Business hub</p>
          <h1 className="page-title">기업 공고를 KSAN이 직접 큐레이션</h1>
          <p className="lead">
            네덜란드와 한국을 잇는 기업 기회, 인턴십, 채용 소식, 파트너십 소식을 학생들에게
            전달합니다.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/business">
              공고 둘러보기
            </Link>
            <Link className="button secondary" href="/mypage">
              저장/지원 기록 보기
            </Link>
          </div>
        </div>
        <aside className="ops-board">
          <div className="ops-row">
            <span className="label">For students</span>
            <strong>채용과 인턴십</strong>
            <span className="badge live">Open</span>
          </div>
          <div className="ops-row">
            <span className="label">For companies</span>
            <strong>학생 커뮤니티 연결</strong>
            <span className="badge">Partner</span>
          </div>
          <div className="ops-row">
            <span className="label">Apply</span>
            <strong>이메일 또는 외부 링크</strong>
            <span className="badge">Now</span>
          </div>
        </aside>
      </section>
      <div className="grid">
        {fallbackBusinessPosts.map((post) => (
          <article className="card" key={post.id}>
            <p className="muted">{post.company} · {post.location}</p>
            <h2>{post.title}</h2>
            <p className="muted">{post.description}</p>
            <p className="muted">형태: {post.employmentType}</p>
            <div className="button-row">
              <a className="button" href={applyHref(post.applyMode, post.applyTarget)}>
                <Briefcase size={18} aria-hidden /> 지원하기
              </a>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
