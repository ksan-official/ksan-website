import type { BusinessPost, EventPost, GuideDetail, GuideSummary } from "@/lib/types";

export const comingSoonSections = [
  {
    title: "Pass it On",
    description: "나눔과 중고거래 기능은 추후 오픈 예정입니다."
  },
  {
    title: "Community",
    description: "익명 커뮤니티 기능은 추후 오픈 예정입니다."
  }
];

export const fallbackGuides: GuideSummary[] = [
  {
    id: "fallback-bsn",
    slug: "bsn-a-to-z",
    title: "BSN 신청부터 수령까지 A to Z",
    category: "행정·체류",
    categoryId: "residency",
    summary: "네덜란드 도착 후 BSN을 받아야 하는 학생을 위한 절차형 가이드입니다.",
    updatedAt: "2026-03-15",
    author: "KSAN 기획총괄팀",
    tags: ["BSN", "행정", "정착"]
  },
  {
    id: "fallback-bank",
    slug: "bank-account",
    title: "은행 계좌 개설",
    category: "생활",
    categoryId: "living",
    summary: "네덜란드 주요 은행 계좌 개설 전 확인할 정보를 정리합니다.",
    updatedAt: "2026-03-15",
    author: "KSAN 기획총괄팀",
    tags: ["은행", "생활"]
  }
];

export const fallbackGuideDetail: GuideDetail = {
  ...fallbackGuides[0],
  blocks: [
    { id: "h1", type: "heading_1", text: "BSN이 무엇인가요?" },
    {
      id: "p1",
      type: "paragraph",
      text: "BSN은 네덜란드 정부가 거주자에게 부여하는 고유 번호입니다."
    },
    { id: "h2", type: "heading_2", text: "신청 절차" },
    { id: "h3-1", type: "heading_3", text: "Gemeente 예약" },
    { id: "p2", type: "paragraph", text: "거주할 도시의 시청에서 가능한 방문 일정을 먼저 확인합니다." },
    { id: "h3-2", type: "heading_3", text: "필요 서류" },
    { id: "l1", type: "bulleted_list_item", text: "여권과 거주지 증명 서류" },
    { id: "l2", type: "bulleted_list_item", text: "학교 등록 확인서 또는 입학 증빙" },
    { id: "h3-3", type: "heading_3", text: "방문 등록" },
    { id: "p3", type: "paragraph", text: "예약 시간에 맞춰 방문하고 담당자의 안내에 따라 등록을 완료합니다." },
    { id: "h3-4", type: "heading_3", text: "수령" },
    { id: "p4", type: "paragraph", text: "등록 후 안내받은 방식으로 BSN을 확인하고 안전하게 보관합니다." },
    { id: "h4", type: "heading_1", text: "자주 묻는 질문" },
    { id: "p5", type: "paragraph", text: "예약이 늦어질 수 있으니 도착 전 가능한 날짜를 먼저 확인하세요." }
  ],
  related: [fallbackGuides[1]]
};

export const fallbackBusinessPosts: BusinessPost[] = [
  {
    id: "business-1",
    title: "마케팅 인턴",
    company: "Sample Company",
    location: "Amsterdam",
    employmentType: "Internship",
    deadline: null,
    applyMode: "email",
    applyTarget: "careers@example.com",
    description: "관리자 페이지 연결 전까지 노출되는 샘플 공고입니다."
  }
];

export const fallbackEvents: EventPost[] = [
  {
    id: "event-1",
    title: "KSAN 오리엔테이션",
    startsAt: "2026-09-01T18:00:00+02:00",
    location: "Amsterdam",
    description: "행사 관리 기능 연결 전까지 노출되는 샘플 행사입니다.",
    registrationMode: "google_form",
    registrationTarget: "https://forms.google.com/"
  }
];
