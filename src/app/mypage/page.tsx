import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Bookmark, Briefcase, CalendarCheck, Settings, UserRound } from "lucide-react";

const myPageItems: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
  state: "live" | "pending";
  href: string;
}> = [
  {
    title: "채용 활동",
    description: "지원하거나 저장한 공고를 모읍니다.",
    Icon: Briefcase,
    state: "live",
    href: "/mypage/business"
  },
  {
    title: "신청한 이벤트",
    description: "사이트 내부 폼으로 제출한 신청 내역을 보여줍니다.",
    Icon: CalendarCheck,
    state: "live",
    href: "/mypage/events"
  },
  {
    title: "저장한 가이드",
    description: "나중에 다시 볼 정착가이드를 모읍니다.",
    Icon: Bookmark,
    state: "live",
    href: "/mypage/guides"
  },
  {
    title: "프로필",
    description: "이름, 학교, 전공, 입학연도를 확인합니다.",
    Icon: UserRound,
    state: "live",
    href: "/mypage/profile"
  },
  {
    title: "커뮤니티 기록",
    description: "익명 커뮤니티 오픈 시 작성글과 댓글을 연결합니다.",
    Icon: Settings,
    state: "pending",
    href: "/mypage/community"
  },
  {
    title: "Pass it On 기록",
    description: "중고거래/나눔 기능 오픈 시 저장·작성 기록을 연결합니다.",
    Icon: Settings,
    state: "pending",
    href: "/mypage/pass-it-on"
  }
];

export default function MyPage() {
  return (
    <main className="page" id="main">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">My page</p>
          <h1 className="page-title">내 활동이 쌓이는 공간</h1>
          <p className="lead">
            프로필, 저장한 가이드, 저장한 공고, 신청한 이벤트를 각각의 페이지에서 확인합니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="grid">
          {myPageItems.map(({ title, description, Icon, state, href }) => (
            <Link className="card interactive" href={href} key={title}>
              <Icon size={22} aria-hidden />
              <span className={state === "live" ? "badge live" : "badge pending"}>
                {state === "live" ? "MVP ready" : "Later"}
              </span>
              <h2>{title}</h2>
              <p className="muted">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
