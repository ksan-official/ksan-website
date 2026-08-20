import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { listGuides } from "@/lib/guides";

export default async function GuidesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim().toLowerCase() ?? "";
  const guides = await listGuides();
  const filtered = query
    ? guides.filter((guide) =>
        [guide.title, guide.summary, guide.category, ...guide.tags]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : guides;

  return (
    <main className="page" id="main">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Settlement guide</p>
          <h1 className="page-title">네덜란드 생활을 시작하는 학생들을 위한 가이드</h1>
          <p className="lead">
            BSN, 은행, 보험, 비자, 학교생활처럼 처음 네덜란드에 도착했을 때 막히는 정보를
            주제별로 찾아볼 수 있습니다.
          </p>
        </div>
      </section>

      <section className="section">
        <form className="form" action="/guides">
          <label className="field">
            <span>가이드 검색</span>
            <input name="q" defaultValue={query} placeholder="BSN, 은행, 보험, 비자..." />
          </label>
          <button className="button" type="submit">
            <Search size={18} aria-hidden /> 검색
          </button>
        </form>
        <div className="grid">
          {filtered.map((guide) => (
            <Link className="card" href={`/guides/${guide.slug}`} key={guide.id}>
              <BookOpen size={22} aria-hidden />
              <p className="muted">{guide.category}</p>
              <h2>{guide.title}</h2>
              <p className="muted">{guide.summary}</p>
            </Link>
          ))}
          {!filtered.length ? <p className="muted">등록된 가이드가 없습니다.</p> : null}
        </div>
      </section>
    </main>
  );
}
