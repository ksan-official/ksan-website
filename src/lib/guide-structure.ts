export type GuidePriority = "core" | "useful" | "optional";

export type GuideTreeItem = {
  title: string;
  priority: GuidePriority;
  topics: string[];
};

export type GuideCategory = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  items: GuideTreeItem[];
};

export const guideCategories: GuideCategory[] = [
  {
    id: "start",
    title: "처음 정착하기",
    emoji: "🧭",
    description: "도착 전부터 첫 3개월까지, 해야 할 일을 시간 순서대로 확인해요.",
    items: [
      {
        title: "정착 체크리스트",
        priority: "core",
        topics: ["도착 전", "첫 1주", "첫 1개월", "3개월 내"]
      }
    ]
  },
  {
    id: "housing",
    title: "주거",
    emoji: "🏠",
    description: "집 찾기부터 계약, 세금과 생활비까지 주거의 기본을 모았어요.",
    items: [
      {
        title: "집 구하기·계약 (하우징)",
        priority: "core",
        topics: ["집 유형", "집 구하기", "준비 서류", "주의사항", "도시별 월세 정보", "보증금 & 계약서"]
      },
      {
        title: "물세·쓰레기세",
        priority: "useful",
        topics: ["납부 대상 확인", "물세", "쓰레기세", "감면 신청"]
      }
    ]
  },
  {
    id: "residency",
    title: "행정·체류",
    emoji: "🪪",
    description: "비자, 거주허가, BSN과 DigiD처럼 꼭 필요한 행정 절차를 정리했어요.",
    items: [
      {
        title: "비자·거주허가 (IND)",
        priority: "core",
        topics: ["진행 순서", "IND 방문 준비물", "알아두면 좋은 것들", "공식 연락처"]
      },
      {
        title: "BSN / DigiD",
        priority: "core",
        topics: ["BSN 발급", "DigiD", "이런 상황엔 이렇게"]
      }
    ]
  },
  {
    id: "finance",
    title: "금융·지원",
    emoji: "💳",
    description: "은행 계좌를 만들고 받을 수 있는 보조금을 빠짐없이 확인해요.",
    items: [
      {
        title: "은행 계좌",
        priority: "core",
        topics: ["은행 선택", "계좌 개설 공통사항", "계좌 개설 후 필수 설정"]
      },
      {
        title: "보조금 (Toeslagen)",
        priority: "useful",
        topics: ["Huurtoeslag", "Zorgtoeslag", "공통 신청 방법"]
      }
    ]
  },
  {
    id: "health",
    title: "의료·안전",
    emoji: "🏥",
    description: "보험과 병원 이용법, 긴급한 순간에 필요한 연락처를 찾을 수 있어요.",
    items: [
      {
        title: "건강보험 & 병원",
        priority: "core",
        topics: ["건강보험", "병원·Huisarts 이용", "보험사 안내"]
      },
      {
        title: "긴급 연락처",
        priority: "core",
        topics: ["응급·비응급 연락", "대사관 & 한인 지원", "정신건강 상담", "비상상황 유용 앱"]
      }
    ]
  },
  {
    id: "transport",
    title: "교통",
    emoji: "🚲",
    description: "대중교통, 자전거, 운전면허까지 네덜란드 이동 생활을 준비해요.",
    items: [
      {
        title: "대중교통 이용",
        priority: "core",
        topics: ["교통수단 종류", "결제 방법", "경로 검색·이용 팁"]
      },
      {
        title: "자전거 생활",
        priority: "useful",
        topics: ["자전거 구하는 방법", "필수 준비물", "교통 규칙 & 매너", "대중교통에 싣기", "도난 & 주차", "주의사항"]
      },
      {
        title: "운전면허 사용 & 변경",
        priority: "optional",
        topics: ["가능한 방법", "교환 절차", "필요 서류", "꼭 주의할 점"]
      }
    ]
  },
  {
    id: "living",
    title: "생활",
    emoji: "🛒",
    description: "통신, 날씨, 장보기와 택배 등 매일 마주치는 생활 정보를 모았어요.",
    items: [
      {
        title: "통신 & 인터넷",
        priority: "core",
        topics: ["통신 방법", "통신사 선택", "가정용 인터넷"]
      },
      {
        title: "날씨 & 옷차림",
        priority: "useful",
        topics: ["계절별 날씨·옷차림", "섬머타임", "날씨 앱"]
      },
      {
        title: "장보기 & 생활용품",
        priority: "useful",
        topics: ["식료품", "한식·아시안", "온라인 쇼핑", "생활용품·약국", "가구", "전자제품", "시장", "장보기 팁", "절약 팁"]
      },
      {
        title: "택배 시스템",
        priority: "useful",
        topics: ["주요 택배사", "배송 체크", "자주 생기는 문제"]
      },
      {
        title: "유용한 앱",
        priority: "useful",
        topics: ["교통", "음식·장보기", "금융·행정", "생활"]
      },
      {
        title: "아르바이트",
        priority: "useful",
        topics: ["근무 조건", "최저시급", "많이 하는 일", "어디서 구하나", "시작 전 체크"]
      }
    ]
  },
  {
    id: "culture",
    title: "문화·여가",
    emoji: "🎟️",
    description: "맛집, 박물관, 축제와 여행으로 네덜란드 생활의 즐거움을 넓혀요.",
    items: [
      {
        title: "한식당 리스트",
        priority: "optional",
        topics: ["암스테르담", "헤이그", "위트레흐트", "로테르담", "맛집 정보 채널"]
      },
      {
        title: "뮤지엄 카드",
        priority: "optional",
        topics: ["가격", "추천 이유", "대표 박물관", "구매 방법 & 사용 팁"]
      },
      {
        title: "공휴일 & 축제",
        priority: "useful",
        topics: ["주요 공휴일", "겨울 시즌", "대표 축제", "공휴일 전후 생활 팁"]
      },
      {
        title: "네덜란드 여행",
        priority: "optional",
        topics: ["Amsterdam", "Rotterdam", "Hague", "Leiden", "Utrecht", "Delft", "Eindhoven", "Maastricht"]
      }
    ]
  }
];

export const settlementStages = [
  {
    id: "before-arrival",
    number: "01",
    title: "도착 전",
    description: "출국 전에 준비하면 현지에서 기다리는 시간을 크게 줄일 수 있어요.",
    tasks: ["비자·거주허가 진행 확인", "집과 임시 숙소 준비", "필요 서류 원본 챙기기"]
  },
  {
    id: "first-week",
    number: "02",
    title: "첫 1주",
    description: "주소 등록과 기본 생활 환경부터 차근차근 연결하는 시기예요.",
    tasks: ["시청 등록과 BSN 발급", "현지 통신 수단 마련", "대중교통 결제 준비"]
  },
  {
    id: "first-month",
    number: "03",
    title: "첫 1개월",
    description: "행정 계정을 만들고 금융·의료 생활의 기반을 갖춰요.",
    tasks: ["DigiD 활성화", "은행 계좌 개설", "건강보험과 Huisarts 확인"]
  },
  {
    id: "within-three-months",
    number: "04",
    title: "3개월 내",
    description: "놓치기 쉬운 세금과 보조금까지 확인하면 기본 정착이 완성돼요.",
    tasks: ["보조금 신청 가능 여부 확인", "물세·쓰레기세 확인", "생활 앱과 긴급 연락처 저장"]
  }
] as const;

export const guidePriorityLabels: Record<GuidePriority, string> = {
  core: "먼저 보기",
  useful: "알아두기",
  optional: "필요할 때"
};

export function getGuideCategory(categoryId: string) {
  return guideCategories.find((category) => category.id === categoryId);
}
