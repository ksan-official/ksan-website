export default function AboutPage() {
  return (
    <main className="page" id="main">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">About KSAN</p>
          <h1 className="page-title">네덜란드 한인 학생들을 연결하는 협회</h1>
          <p className="lead">
            KSAN은 네덜란드에서 공부하는 한국 학생들이 서로의 경험과 기회를 나눌 수 있도록
            행사, 정보, 파트너십을 만들어갑니다.
          </p>
        </div>
        <aside className="ops-board">
          <div className="ops-row">
            <span className="label">Now</span>
            <strong>학생 커뮤니티</strong>
            <span className="badge live">Active</span>
          </div>
          <div className="ops-row">
            <span className="label">Next</span>
            <strong>운영진과 파트너</strong>
            <span className="badge">Network</span>
          </div>
        </aside>
      </section>
      <section className="section">
        <div className="grid">
          <section className="card">
            <h2>회장단 및 임원진</h2>
            <p className="muted">placeholder: 현 회장단과 각 팀의 역할을 소개하는 영역입니다.</p>
          </section>
          <section className="card">
            <h2>팀원</h2>
            <p className="muted">placeholder: 기획, 디자인, 파트너십, 운영 등 팀 단위 소개가 들어갑니다.</p>
          </section>
          <section className="card">
            <h2>후원사</h2>
            <p className="muted">placeholder: KSAN과 함께하는 기업, 기관, 파트너를 보여주는 영역입니다.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
