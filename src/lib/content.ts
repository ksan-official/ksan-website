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
    category: "행정 · 비자",
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
    summary: "네덜란드 주요 은행 계좌 개설 전 확인할 정보를 정리합니다.",
    updatedAt: "2026-03-15",
    author: "KSAN 기획총괄팀",
    tags: ["은행", "생활"]
  }
];

export const fallbackGuideDetail: GuideDetail = {
  ...fallbackGuides[0],
  blocks: [
    { id: "h1", type: "heading_2", text: "BSN이 무엇인가요?" },
    {
      id: "p1",
      type: "paragraph",
      text: "BSN은 네덜란드 정부가 거주자에게 부여하는 고유 번호입니다."
    },
    { id: "h2", type: "heading_2", text: "BSN이 필요한 경우" },
    { id: "l1", type: "bulleted_list_item", text: "은행 계좌 개설" },
    { id: "l2", type: "bulleted_list_item", text: "의료보험 가입" },
    { id: "l3", type: "bulleted_list_item", text: "대학 등록 및 학생 카드 발급" }
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
