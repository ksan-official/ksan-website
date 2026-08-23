import Link from "next/link";
import { listGuides } from "@/lib/guides";
import { getIntegrationStatus } from "@/lib/integrations";

const notionFields = [
  ["Title", "글 제목"],
  ["Slug", "웹사이트 주소용 식별자"],
  ["Category", "행정, 생활, 학교, 비자 등"],
  ["Summary", "리스트와 article 상단에 보이는 요약"],
  ["Author", "작성팀 또는 작성자"],
  ["Updated", "업데이트 날짜"],
  ["Tags", "검색과 분류에 쓰는 태그"],
  ["Notion URL", "본문으로 불러올 Notion 공개 글 링크"]
];

export default async function AdminGuidesPage() {
  const guides = await listGuides();
  const status = getIntegrationStatus();

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">정착가이드</p>
          <h1>가이드 관리</h1>
          <p>관리자에서 작성한 글과 나중에 연결할 Notion 글을 같은 공개 페이지로 보냅니다.</p>
        </div>
        <Link className="admin-button" href="/admin/guides/new">
          새 가이드 작성
        </Link>
      </header>

      <section className="admin-section">
        <h2>연동 상태</h2>
        <div className="admin-two-column">
          <div className="admin-field-readonly">
            <span>Notion</span>
            <strong>{status.notion ? "연결됨" : "미연결"}</strong>
          </div>
          <div className="admin-field-readonly">
            <span>현재 읽힌 가이드</span>
            <strong>{guides.length}개</strong>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2>필수 필드</h2>
        <div className="admin-field-grid">
          {notionFields.map(([field, description]) => (
            <div className="admin-field-readonly" key={field}>
              <span>{field}</span>
              <strong>{description}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-title-row">
          <h2>현재 가이드</h2>
          <Link href="/guides">공개 화면 보기</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>카테고리</th>
              <th>작성자</th>
              <th>수정일</th>
            </tr>
          </thead>
          <tbody>
          {guides.map((guide) => (
            <tr key={guide.id}>
              <th>
                <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
              </th>
              <td>{guide.category}</td>
              <td>{guide.author}</td>
              <td>{guide.updatedAt}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
