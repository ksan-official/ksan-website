export type KsanEvent = {
  id: string;
  title: string;
  summary: string;
  description: string;
  date: string;
  dateLabel: string;
  time: string;
  location: string;
  keywords: string[];
  status: "upcoming" | "past";
  image: string;
  recapImages?: string[];
  photoCount?: number;
  audience: string;
  agenda: string[];
};

export const ksanEvents: KsanEvent[] = [
  {
    id: "welcome-night-2026",
    title: "KSAN Welcome Night 2026",
    summary: "새로운 도시에서 시작하는 첫 연결",
    description:
      "네덜란드 생활을 먼저 경험한 학생들의 실용적인 이야기와 새로운 동료를 한 자리에서 만나는 신입생 환영 행사입니다.",
    date: "2026-09-05",
    dateLabel: "2026.09.05",
    time: "17:30–21:00",
    location: "Amsterdam",
    keywords: ["오리엔테이션", "네트워킹"],
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1800&q=85",
    audience: "네덜란드 유학을 시작한 신입생 및 재학생",
    agenda: ["네덜란드 정착 핵심 가이드", "학교·도시별 테이블 네트워킹", "KSAN 커뮤니티 프로그램 소개"]
  },
  {
    id: "career-bridge-2026",
    title: "Career Bridge: NL",
    summary: "현지에서 커리어의 다음 장을 준비하는 법",
    description:
      "네덜란드에서 일하고 있는 선배와 채용 담당자가 이력서, 인턴십, 현지 취업 준비 과정을 구체적으로 나눕니다.",
    date: "2026-10-17",
    dateLabel: "2026.10.17",
    time: "14:00–18:00",
    location: "Rotterdam",
    keywords: ["커리어", "세미나"],
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1800&q=85",
    audience: "네덜란드 취업과 인턴십을 준비하는 학생",
    agenda: ["현지 채용 시장 인사이트", "CV 및 LinkedIn 포트폴리오 세션", "직무별 선배와의 소규모 대화"]
  },
  {
    id: "community-table-2026",
    title: "Community Table",
    summary: "도시와 전공을 넘어 함께 나누는 저녁",
    description:
      "서로 다른 도시에서 공부하는 학생들이 한 테이블에 모여 음식과 경험, 다음 학기의 아이디어를 나누는 커뮤니티 디너입니다.",
    date: "2026-11-28",
    dateLabel: "2026.11.28",
    time: "18:00–21:30",
    location: "Utrecht",
    keywords: ["커뮤니티", "문화교류"],
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1800&q=85",
    audience: "새로운 사람과 편안하게 연결되고 싶은 모든 학생",
    agenda: ["도시별 커뮤니티 체크인", "테이블 토크와 공동 식사", "다음 KSAN 프로젝트 아이디어 월"]
  },
  {
    id: "spring-connect-2026",
    title: "Spring Connect 2026",
    summary: "봄의 암스테르담에서 다시 만난 학생 커뮤니티",
    description: "학기 중간의 경험과 고민을 나누고 새로운 친구를 만난 봄 네트워킹 현장입니다.",
    date: "2026-05-23",
    dateLabel: "2026.05.23",
    time: "Completed",
    location: "Amsterdam",
    keywords: ["네트워킹", "커뮤니티"],
    status: "past",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85",
    recapImages: [
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=85"
    ],
    photoCount: 18,
    audience: "KSAN 학생 커뮤니티",
    agenda: []
  },
  {
    id: "culture-picnic-2026",
    title: "Korea × NL Culture Picnic",
    summary: "두 문화를 가볍게 나눈 야외 교류의 하루",
    description: "한국과 네덜란드 학생들이 각자의 음식과 놀이, 음악을 소개한 문화 교류 피크닉입니다.",
    date: "2026-04-11",
    dateLabel: "2026.04.11",
    time: "Completed",
    location: "The Hague",
    keywords: ["문화교류", "커뮤니티"],
    status: "past",
    image:
      "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=1400&q=85",
    recapImages: [
      "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=85"
    ],
    photoCount: 24,
    audience: "한·네덜란드 학생 커뮤니티",
    agenda: []
  },
  {
    id: "year-end-2025",
    title: "KSAN Year-end Gathering",
    summary: "한 해의 연결을 돌아보고 다음을 약속한 밤",
    description: "2025년의 활동을 함께 돌아보고 학생과 파트너가 편하게 인사를 나눈 연말 모임입니다.",
    date: "2025-12-06",
    dateLabel: "2025.12.06",
    time: "Completed",
    location: "Rotterdam",
    keywords: ["네트워킹", "문화교류"],
    status: "past",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85",
    recapImages: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=900&q=85"
    ],
    photoCount: 31,
    audience: "KSAN 학생 및 협력 파트너",
    agenda: []
  }
];

export const upcomingEvents = ksanEvents.filter((event) => event.status === "upcoming");

export function getKsanEvent(id: string) {
  return ksanEvents.find((event) => event.id === id);
}
