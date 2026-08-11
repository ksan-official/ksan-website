import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "현황" },
  { href: "/admin/guides", label: "정착가이드" },
  { href: "/admin/guides/new", label: "가이드 작성" },
  { href: "/admin/business/new", label: "공고 등록" },
  { href: "/admin/events/new", label: "행사 등록" },
  { href: "/admin/about/new", label: "소개 수정" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          KSAN Admin
        </Link>
        <nav className="admin-nav" aria-label="관리자 메뉴">
          {adminLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <Link href="/">공개 사이트 보기</Link>
          <Link href="/auth">로그인</Link>
          <Link href="/setup">연동 설정</Link>
        </div>
      </aside>
      <div className="admin-workspace">{children}</div>
    </div>
  );
}
