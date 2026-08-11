import Link from "next/link";
import { getOptionalEnv } from "@/lib/env";

const integrations = [
  {
    name: "Supabase",
    status: Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
    purpose: "로그인, 관리자 권한, 공고/행사/신청/마이페이지 데이터 저장",
    env: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  },
  {
    name: "Notion",
    status: Boolean(getOptionalEnv("NOTION_API_KEY") && getOptionalEnv("NOTION_GUIDES_DATABASE_ID")),
    purpose: "정착가이드 글 작성 원본. 사이트는 Notion 글을 읽어서 자체 article UI로 렌더링",
    env: "NOTION_API_KEY, NOTION_GUIDES_DATABASE_ID"
  },
  {
    name: "Google Sheets",
    status: Boolean(getOptionalEnv("GOOGLE_APPS_SCRIPT_WEBHOOK_URL")),
    purpose: "행사/공고 신청 데이터를 운영진이 보기 쉬운 Sheet에 자동 복사",
    env: "GOOGLE_APPS_SCRIPT_WEBHOOK_URL, GOOGLE_APPS_SCRIPT_SHARED_SECRET"
  }
];

export default function SetupPage() {
  return (
    <main className="page" id="main">
      <p className="eyebrow">Integration setup</p>
      <h1 className="page-title">연동은 여기서 확인하면 돼요</h1>
      <p className="lead">
        이 페이지는 운영진이나 IT 담당자가 “무엇을 어디에 연결해야 하는지” 확인하는 내부 안내판입니다.
        실제 값은 `.env.local`에 넣고, 배포할 때 Netlify 환경 변수에도 같은 값을 등록합니다.
      </p>

      <section className="section">
        <div className="grid">
          {integrations.map((item) => (
            <section className="card" key={item.name}>
              <span className={item.status ? "badge live" : "badge pending"}>
                {item.status ? "Connected" : "Not connected"}
              </span>
              <h2>{item.name}</h2>
              <p className="muted">{item.purpose}</p>
              <code className="code">{item.env}</code>
            </section>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Notion 정착가이드 연결 순서</h2>
          <Link className="button secondary" href="/guides">
            가이드 화면 보기
          </Link>
        </div>
        <div className="setup-list">
          <div className="setup-item">
            <strong>Notion database를 만든다</strong>
            <span className="muted">
              속성은 Title, Slug, Category, Summary, Author, Updated, Tags를 사용합니다.
            </span>
          </div>
          <div className="setup-item">
            <strong>Notion integration을 만든 뒤 database에 초대한다</strong>
            <span className="muted">
              integration secret은 `NOTION_API_KEY`, database id는 `NOTION_GUIDES_DATABASE_ID`에 넣습니다.
            </span>
          </div>
          <div className="setup-item">
            <strong>글은 Notion에서 편하게 쓰고, 화면은 사이트가 만든다</strong>
            <span className="muted">
              heading 블록은 오른쪽 목차가 되고, 본문은 KSAN article layout으로 표시됩니다.
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Supabase와 Sheets 흐름</h2>
          <Link className="button secondary" href="/admin">
            관리자 페이지
          </Link>
        </div>
        <div className="flow">
          <div className="flow-step">
            <strong>사용자가 사이트 안 신청서를 제출</strong>
            <span className="muted">행사 신청 또는 나중의 내부 공고 지원 폼에서 시작합니다.</span>
          </div>
          <div className="flow-step">
            <strong>Supabase applications 테이블에 원본 저장</strong>
            <span className="muted">마이페이지와 관리자 페이지는 이 데이터를 기준으로 읽습니다.</span>
          </div>
          <div className="flow-step">
            <strong>Google Apps Script webhook으로 Sheet에 복사</strong>
            <span className="muted">운영진 공유용입니다. 실패하면 sync 상태가 failed로 남습니다.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
