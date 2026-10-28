"use client";

import { useSyncExternalStore } from "react";
import { isLocalDesignMode } from "@/lib/design-preview";

export type ActivityKind = "community" | "market";
export type LocalReply = { id: string; author: string; body: string };
export type LocalActivity = {
  id: string;
  kind: ActivityKind;
  title: string;
  body: string;
  author: string;
  category: string;
  city: string;
  price: number;
  image: string;
  createdAt: string;
  owned: boolean;
  saved: boolean;
  liked: boolean;
  likes: number;
  sold: boolean;
  replies: LocalReply[];
  messages: LocalReply[];
};

export const localNickname = "운하산책";
const base = { createdAt: "2026-10-21T08:00:00Z", owned: false, saved: false, liked: false, likes: 0, sold: false, replies: [], messages: [], city: "", price: 0, image: "" };
const initialActivities: LocalActivity[] = [
  { ...base, id: "forest-1", kind: "community", category: "질문", author: "자전거타는곰", title: "암스테르담에서 자전거 수리 어디서 하세요?", body: "등굣길에 자전거 체인이 빠졌어요. 학생이 가기 괜찮은 수리점이 있으면 추천 부탁드려요!", likes: 8, saved: true, replies: [{ id: "reply-1", author: localNickname, body: "학교 근처 자전거 수리점도 한번 확인해 보세요!" }] },
  { ...base, id: "forest-2", kind: "community", category: "일상", author: localNickname, title: "네덜란드의 첫 가을, 생각보다 좋네요", body: "비가 그친 뒤 운하 옆을 걸었는데 단풍이 정말 예쁘더라고요. 여러분은 요즘 어떻게 지내세요?", owned: true, likes: 12 },
  { ...base, id: "forest-3", kind: "community", category: "정보", author: "튤립한송이", title: "처음 집 구할 때 체크했던 것들", body: "계약 전 주소 등록이 가능한지, 관리비에 무엇이 포함되는지 꼭 확인하세요. 방을 직접 볼 수 없다면 영상 투어를 요청하는 것도 도움이 됐어요.", likes: 21 },
  { ...base, id: "market-1", kind: "market", category: "자전거", author: "자전거타는곰", title: "학생용 자전거", body: "등하교할 때 타던 자전거입니다. 잠금장치 함께 드려요. 암스테르담에서 직접 보고 가져가실 수 있어요.", city: "Amsterdam", price: 85, image: "/images/market-preview/bicycle.jpg", saved: true },
  { ...base, id: "market-2", kind: "market", category: "생활용품", author: localNickname, title: "오렌지 책상 조명", body: "이사하면서 정리합니다. 작동 잘 되고 책상 위에 두기 좋은 크기예요. 로테르담에서 픽업 가능합니다.", city: "Rotterdam", price: 18, image: "/images/market-preview/desk-lamp.jpg", owned: true },
  { ...base, id: "market-3", kind: "market", category: "교재 · 책", author: "도서관산책", title: "전공 교재 세트", body: "수업 때 사용한 교재입니다. 필요한 분께 판매해요. 책 상태와 구성은 문의 주세요.", city: "Leiden", price: 24, image: "/images/market-preview/textbooks.jpg" },
  { ...base, id: "market-4", kind: "market", category: "주방용품", author: "작은부엌", title: "1인용 미니 밥솥", body: "혼자 쓰기 좋은 밥솥이에요. 세척해 두었고 델프트에서 픽업하실 수 있습니다.", city: "Delft", price: 32, image: "/images/market-preview/rice-cooker.jpg" },
  { ...base, id: "market-5", kind: "market", category: "가구", author: "운하옆집", title: "원목 협탁", body: "침대 옆에 두고 쓰던 협탁입니다. 이사 날짜 전에 가져가실 분을 찾습니다.", city: "Utrecht", price: 28, image: "/images/market-preview/nightstand.jpg" },
  { ...base, id: "market-6", kind: "market", category: "무료 나눔", author: "새로운시작", title: "생활용품 꾸러미", body: "귀국 전에 생활용품을 나눔합니다. 필요한 분께 한 번에 드리고 싶어요.", city: "Den Haag", price: 0, image: "/images/market-preview/student-essentials.jpg" }
];

const storageKey = "ksan-local-activities-v1";
let cachedRaw: string | null | undefined;
let snapshot = initialActivities;
const listeners = new Set<() => void>();
function readSnapshot() {
  if (!isLocalDesignMode || typeof window === "undefined") return initialActivities;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      snapshot = Array.isArray(parsed) && parsed.every((item) => item && typeof item.id === "string" && Array.isArray(item.replies) && Array.isArray(item.messages)) ? parsed as LocalActivity[] : initialActivities;
    }
  } catch { /* Keep the current session usable if browser storage is unavailable. */ }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) listener(); };
  window.addEventListener("storage", handleStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", handleStorage); };
}
function updateActivities(update: (records: LocalActivity[]) => LocalActivity[]) {
  if (!isLocalDesignMode) return;
  snapshot = update(readSnapshot());
  try { const raw = JSON.stringify(snapshot); localStorage.setItem(storageKey, raw); cachedRaw = raw; } catch { /* Changes remain available until the page reloads. */ }
  listeners.forEach((listener) => listener());
}
export function useLocalActivities() {
  const records = useSyncExternalStore(subscribe, readSnapshot, () => initialActivities);
  return {
    records,
    add: (record: LocalActivity) => updateActivities((items) => [record, ...items]),
    change: (id: string, update: (record: LocalActivity) => LocalActivity) => updateActivities((items) => items.map((item) => item.id === id ? update(item) : item))
  };
}
