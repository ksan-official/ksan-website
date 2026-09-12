import { getNotionBlocksFromUrl } from "@/lib/notion";
import { createServiceSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import { resolveGuideCategory } from "@/lib/guide-structure";
import type { GuideBlock, GuideDetail, GuideSummary } from "@/lib/types";

type GuidePostRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  author: string | null;
  tags: string[] | null;
  related_ids?: string[] | null;
  blocks: GuideBlock[] | null;
  published: boolean;
  updated_at: string;
  notion_url?: string | null;
};

const demoGuideSummaries: GuideSummary[] = [
  {
    id: "demo-settlement-checklist",
    slug: "settlement-checklist-netherlands",
    title: "정착 체크리스트",
    category: "처음 정착하기",
    categoryId: "start",
    summary: "출국 전부터 도착 후 첫 3개월까지 꼭 챙겨야 하는 절차를 한 번에 확인해요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["도착 전", "첫 1주", "BSN", "DigiD"]
  },
  {
    id: "demo-housing-contract",
    slug: "first-week-arrival-setup",
    title: "도착 후 첫 1주 세팅",
    category: "처음 정착하기",
    categoryId: "start",
    summary: "공항 도착부터 SIM, 교통카드, 시청 예약까지 첫 주에 끝내면 좋은 일을 정리했어요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["첫 1주", "SIM", "교통", "시청"],
    isDemoLocked: true
  },
  {
    id: "demo-bsn-digid-start",
    slug: "bsn-digid-first-steps",
    title: "BSN / DigiD 시작하기",
    category: "처음 정착하기",
    categoryId: "start",
    summary: "네덜란드 행정 서비스의 기본이 되는 BSN과 DigiD를 어떤 순서로 준비할지 확인해요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["BSN", "DigiD", "행정"],
    isDemoLocked: true
  },
  {
    id: "demo-first-month-budget",
    slug: "first-month-budget-netherlands",
    title: "첫 달 생활비 체크",
    category: "처음 정착하기",
    categoryId: "start",
    summary: "월세, 보증금, 교통비, 통신비처럼 첫 달에 크게 나가는 비용을 미리 가늠해요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["생활비", "월세", "예산"],
    isDemoLocked: true
  },
  {
    id: "demo-housing-contract",
    slug: "housing-contract-netherlands",
    title: "집 구하기·계약 (하우징)",
    category: "주거",
    categoryId: "housing",
    summary: "방 찾기, 계약서 확인, 보증금과 사기 예방까지 주거의 기본 흐름을 정리했어요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["집", "계약", "보증금"],
    isDemoLocked: true
  },
  {
    id: "demo-residence-permit",
    slug: "residence-permit-ind",
    title: "비자·거주허가 (IND)",
    category: "행정·체류",
    categoryId: "residency",
    summary: "IND 방문, 거주허가 카드 수령, 주소 등록 전후로 필요한 준비물을 확인해요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["IND", "비자", "거주허가"],
    isDemoLocked: true
  },
  {
    id: "demo-bank-account",
    slug: "bank-account-netherlands",
    title: "은행 계좌",
    category: "금융·지원",
    categoryId: "finance",
    summary: "네덜란드에서 계좌를 열 때 필요한 서류와 주요 은행 선택 기준을 비교해요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["은행", "계좌", "카드"],
    isDemoLocked: true
  },
  {
    id: "demo-health-insurance",
    slug: "health-insurance-huisarts",
    title: "건강보험 & 병원",
    category: "의료·안전",
    categoryId: "health",
    summary: "보험 가입, huisarts 등록, 응급 상황 연락처까지 의료 생활의 시작을 정리했어요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["보험", "병원", "Huisarts"],
    isDemoLocked: true
  },
  {
    id: "demo-public-transport",
    slug: "public-transport-netherlands",
    title: "대중교통 이용",
    category: "교통",
    categoryId: "transport",
    summary: "OVpay, NS, 버스·트램 이용법과 학생들이 자주 헷갈리는 결제 방식을 모았어요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["교통", "OVpay", "NS"],
    isDemoLocked: true
  },
  {
    id: "demo-grocery-living",
    slug: "grocery-and-living-netherlands",
    title: "장보기 & 생활용품",
    category: "생활",
    categoryId: "living",
    summary: "마트, 한식 재료, 생활용품 구매처와 처음 살 때 필요한 기본 품목을 정리했어요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["장보기", "생활용품", "한식"],
    isDemoLocked: true
  },
  {
    id: "demo-korean-restaurants",
    slug: "korean-restaurants-netherlands",
    title: "한식당 리스트",
    category: "문화·여가",
    categoryId: "culture",
    summary: "암스테르담, 헤이그, 로테르담 등 도시별 한식당과 학생 추천 맛집을 모을 예정이에요.",
    updatedAt: "2026-09-11",
    author: "KSAN",
    tags: ["한식", "맛집", "도시별"],
    isDemoLocked: true
  }
];

const demoGuideDetail: GuideDetail = {
  ...demoGuideSummaries[0],
  blocks: [
    {
      id: "demo-intro",
      type: "paragraph",
      text: "처음 네덜란드에 도착하면 해야 할 일이 한 번에 몰려와서 정신없을 수 있어요. 이 체크리스트는 도착 전 준비부터 첫 3개월까지 꼭 필요한 순서를 빠르게 훑어볼 수 있도록 만든 발표용 예시 가이드입니다."
    },
    {
      id: "demo-quick-summary",
      type: "callout",
      text: "핵심 순서는 주거 주소 확보 → 시청 등록 및 BSN → DigiD → 은행 계좌 → 보험/보조금 확인입니다. 이 다섯 가지만 잡히면 대부분의 정착 절차가 연결돼요."
    },
    {
      id: "demo-before-heading",
      type: "heading_2",
      text: "도착 전"
    },
    {
      id: "demo-before-desc",
      type: "paragraph",
      text: "출국 전에 준비해두면 현지에서 기다리는 시간을 줄일 수 있는 항목입니다. 원본 서류는 따로 보관하고, 모든 문서는 클라우드에도 백업해두는 것을 추천해요."
    },
    {
      id: "demo-before-1",
      type: "to_do",
      text: "여권, 입학허가서, 보험 관련 서류, 주거 계약서 또는 임시 숙소 예약 내역을 PDF와 출력본으로 함께 준비하세요."
    },
    {
      id: "demo-before-2",
      type: "to_do",
      text: "IND 또는 학교에서 안내한 거주허가 절차와 예약 일정을 다시 확인하세요."
    },
    {
      id: "demo-before-3",
      type: "to_do",
      text: "첫 달 생활비와 보증금, 교통비를 포함해 최소 1~2개월치 여유 자금을 준비하세요."
    },
    {
      id: "demo-first-week-heading",
      type: "heading_2",
      text: "첫 1주"
    },
    {
      id: "demo-first-week-callout",
      type: "callout",
      text: "시청 등록과 BSN 발급은 은행 계좌, 통신, 보험 등 거의 모든 절차의 시작점입니다. 가능한 빠르게 예약을 잡아두는 것이 좋아요."
    },
    {
      id: "demo-first-week-1",
      type: "to_do",
      text: "거주 주소가 확정되면 Gemeente 예약을 잡고 BSN 발급을 진행하세요."
    },
    {
      id: "demo-first-week-2",
      type: "to_do",
      text: "현지 SIM 또는 eSIM을 준비하고, 학교 계정과 개인 이메일을 모두 확인할 수 있게 설정하세요."
    },
    {
      id: "demo-first-week-3",
      type: "to_do",
      text: "OVpay 또는 교통 앱을 설정하고 학교·집·마트까지의 기본 이동 동선을 익혀두세요."
    },
    {
      id: "demo-first-month-heading",
      type: "heading_2",
      text: "첫 1개월"
    },
    {
      id: "demo-first-month-desc",
      type: "paragraph",
      text: "첫 달에는 행정 계정과 결제 수단을 정리하는 것이 가장 중요합니다. 이 단계가 끝나면 월세 납부, 보험, 학교 생활이 훨씬 안정적으로 돌아가기 시작해요."
    },
    {
      id: "demo-first-month-1",
      type: "to_do",
      text: "DigiD를 신청하고 활성화하세요. 이후 보조금, 세금, 공공 서비스 로그인에 필요합니다."
    },
    {
      id: "demo-first-month-2",
      type: "to_do",
      text: "은행 계좌를 개설하고 월세, 보험료, 통신비 자동이체를 정리하세요."
    },
    {
      id: "demo-first-month-3",
      type: "to_do",
      text: "학교 포털, 학생증, 도서관 계정, Canvas/메일 알림을 실제로 사용할 수 있는지 확인하세요."
    },
    {
      id: "demo-three-month-heading",
      type: "heading_2",
      text: "첫 3개월"
    },
    {
      id: "demo-three-month-1",
      type: "bulleted_list_item",
      text: "건강보험 또는 학교 보험 조건을 확인하고, 필요한 경우 huisarts 등록을 진행하세요."
    },
    {
      id: "demo-three-month-2",
      type: "bulleted_list_item",
      text: "Huurtoeslag, Zorgtoeslag 등 받을 수 있는 보조금이 있는지 확인하세요."
    },
    {
      id: "demo-final-note",
      type: "callout",
      text: "학교와 도시마다 절차가 조금씩 다를 수 있어요. 확정된 정보는 학교 안내 메일, Gemeente, IND 공식 페이지를 기준으로 다시 확인하세요."
    }
  ],
  related: []
};

function mapGuideRow(row: GuidePostRow): GuideSummary {
  const category = resolveGuideCategory(row.category);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: category.title,
    categoryId: category.id,
    summary: row.summary ?? "",
    updatedAt: row.updated_at.slice(0, 10),
    author: row.author ?? "KSAN",
    tags: row.tags ?? [],
    relatedIds: row.related_ids ?? []
  };
}

async function listSupabaseGuides() {
  if (!hasSupabaseConfig()) {
    return [];
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("guide_posts")
      .select("*")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to load published guides", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapGuideRow(row as GuidePostRow));
  } catch {
    console.error("Failed to load published guides");
    return [];
  }
}

async function getSupabaseGuideBySlug(slug: string): Promise<GuideDetail | null> {
  if (!hasSupabaseConfig()) {
    return null;
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("guide_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !data) {
      if (error) console.error("Failed to load guide by slug", error.message);
      return null;
    }

    const summary = mapGuideRow(data as GuidePostRow);
    const relatedIds = ((data as GuidePostRow).related_ids ?? []).slice(0, 3);
    const guides = await listSupabaseGuides();
    const related = relatedIds
      .map((id) => guides.find((guide) => guide.id === id))
      .filter((guide) => guide?.slug !== slug)
      .filter((guide): guide is GuideSummary => Boolean(guide));

    let blocks = ((data as GuidePostRow).blocks ?? []) as GuideBlock[];
    const notionUrl = (data as GuidePostRow).notion_url;
    if (notionUrl && process.env.NOTION_API_KEY) {
      try {
        blocks = await getNotionBlocksFromUrl(notionUrl);
      } catch {
        // Keep the stored blocks as a safe fallback if the page is not shared with the integration.
      }
    }

    return {
      ...summary,
      blocks,
      related
    };
  } catch {
    console.error("Failed to load guide by slug");
    return null;
  }
}

export async function listGuides(): Promise<GuideSummary[]> {
  const supabaseGuides = await listSupabaseGuides();
  const demoSlugs = new Set(demoGuideSummaries.map((guide) => guide.slug));
  return [
    ...demoGuideSummaries,
    ...supabaseGuides.filter((guide) => !demoSlugs.has(guide.slug))
  ];
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  if (slug === demoGuideDetail.slug) {
    return demoGuideDetail;
  }

  return getSupabaseGuideBySlug(slug);
}
